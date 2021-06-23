exports = async function(changeEvent) {
  /*
   * This function accepts a player activity object and writes it to an activity file in S3. 
   * If a matching file for the player and time period (YYYY-MM) is found, the file will
   * be updated, otherwise a new file will be created in the bucket. It also updates the 
   * playerRoster and playerActivity7Days collections cia aggregation pipelines.
   *
   * Date          Version        Author            Notes
   * ---------------------------------------------------------------------
   * 2021-06-136   1.0            Roy Kiesler       Initial version. Separated from funcAddActivity for easier invocation from Unity client app
   *                                                Also added $match criteria to both aggregation pipelines
   *
   */
   
  let activity = changeEvent.fullDocument;
  console.log(`ACTIVITY: ${JSON.stringify(activity)}`);
   
  // add timestamp to the activity
  let ts = new Date();
  if (null == activity.activityDt || undefined == null == activity.activityDt) {
    activity.activityDt = ts;
  }
   
  // Set the Credentials, Region
  const AWS = require('aws-sdk');
  AWS.config.update({
    accessKeyId: context.values.get("ACCESS_KEY_ID"),
    secretAccessKey: context.values.get("SECRET_ACCESS_KEY_VAR"),
    region: "us-west-1",
  });

  // Create S3 service object
  s3 = new AWS.S3({apiVersion: '2006-03-01'});

  // write activity to player telemetry on S3
  const s3bucket = context.values.get("e2eS3Bucket");
  const filename = `raw/${activity.playerId}/${activity.characterId}/${ts.getFullYear()}-${ts.getMonth().toString().padStart(2, '0')}.json`;  // PlayerId-CharacterId-YYYY-MM
  
  // check if file already exists in S3
  try {
    // set the s3.getObject parameters
    const getParams = {
      Bucket: s3bucket,
      Key: filename
    };
    
    s3.getObject({ 'Bucket': s3bucket, 'Key': filename }, (err, data) => {
      // err => object not found
      if (err) {
        let activities = [activity];

        // parameters for s3.putObject call
        const putParams = {
          "Bucket": s3bucket,
          "Key": filename,
          "Body": JSON.stringify(activities, null, 2),
          "ContentType": "application/json"
        };
        
        // insert new activity file to S3
        try {
          s3.putObject(putParams, (err, data) => {
            // handle any error and exit
            if (err) {
                console.log("PutObject error: ", err.toString('utf-8'));
                return err;
            }
      
            // activity saved successfully
              console.log(`${filename} created...`);
          });
        } catch(putErr) {
          console.log("PutObject exception (insert): ", putErr.toString('utf-8'));
        }
      } else {
        // no error => file already exists in S3, so update w/ new activity

        // Convert Body from a Buffer to a String
        let objectData = data.Body.toString('utf-8');

        // activities are always an array
        let activities = JSON.parse(objectData);
        if (Array.isArray(activities) && activities.length > 0) {
          // add new activity to the list
          activities.push(activity);

          const putParams = {
            "Bucket": s3bucket,
            "Key": filename,
            "Body": JSON.stringify(activities, null, 2),
            "ContentType": "application/json"
          };
            
          try {
            s3.putObject(putParams, (err, data) => {
              // handle any error and exit
              if (err) {
                  console.log("PutObject error", err.toString('utf-8'));
                  return err;
              }
        
              // No error happened
              console.log(`${filename} updated...`);
            });
          } catch (putErr) {
            console.log("PutObject exception (update)", putErr.toString('utf-8'));
          }
        } else {
          console.log("This shouldn't happen -- activities isn't an array??");
          console.log(JSON.stringify(activities, null, 2));
        }
      }
    });
    
    // Step 1: Start a Client Session
    const client = context.services.get("mongodb-atlas");
    const session = client.startSession();
    
    // Step 2: Define options to use for the transaction (optional)
    const transactionOptions = {
      readPreference: "primary",
      readConcern: { level: "local" },
      writeConcern: { w: "majority" },
    };
    
    // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
    // Note: The callback for withTransaction MUST be async and/or return a Promise.
    try {
      await session.withTransaction(async () => {
        await aggregateActivitiesForOffers(activity);
      }, transactionOptions);
    } catch (err) {
      // Step 5a: Handle errors with a transaction abort
      console.log(`CATCH: ${err} | ABORT`);
      await session.abortTransaction();
    } finally {
      // Step 6: End the session when you complete the transaction
      await session.endSession();
    }
  } catch (getErr) {
    console.log("GET ERROR: " + getErr);
    // another S3 getObject error
    throw getErr;
  }
};

async function aggregateActivitiesForOffers(activity) {
    // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const rosterCollection = db.collection("playerRoster");
  const last7daysCollection = db.collection("playerActivityLast7Days");

  const aggrPipeline1 = [
    {
      "$match": {
        "playerId": activity.playerId,
        "roster.characterId": activity.characterId
      }
    },
    {
      "$unwind": { "path": "$roster" }
    }, {
      "$match": {
        "roster.characterId": activity.characterId
      }
    },
    {
      "$addFields": {
        "isNextRankARedStar": {
          "$gt": ["$roster.redStars", "$roster.stars"]
        }
      }
    }, {
      "$group": {
        "_id": {
          "p": "$playerId",
          "c": "$roster.characterId",
          "n": "$isNextRankARedStar"
        },
        "totalShards": { "$sum": "$roster.shards" }
      }
    }, {
      "$addFields": {
        "shardsToNextRank": {
          "$switch": {
            "branches": [
              { "case": { "$gte": [ "$totalShards", 810 ] }, "then": 0 },
              { "case": { "$gte": [ "$totalShards", 510 ] }, "then": { "$subtract": [ 810, "$totalShards" ] } },
              { "case": { "$gte": [ "$totalShards", 310 ] }, "then": { "$subtract": [ 510, "$totalShards" ] } },
              { "case": { "$gte": [ "$totalShards", 180 ] }, "then": { "$subtract": [ 310, "$totalShards" ] } },
              { "case": { "$gte": [ "$totalShards", 100 ] }, "then": { "$subtract": [ 180, "$totalShards" ] } },
              { "case": { "$gte": [ "$totalShards", 45 ] }, "then": { "$subtract": [ 100, "$totalShards" ] } },
              { "case": { "$gte": [ "$totalShards", 15 ] }, "then": { "$subtract": [ 45, "$totalShards" ] } },
            ],
            "default": { "$subtract": [ 15, "$totalShards" ] }
          }
        },
        "isNextRankARedStar": "$_id.n"
      }
    }, {
      "$lookup": {
        "from": "playerProfile",
        "localField": "_id.p",
        "foreignField": "playerId",
        "as": "profile"
      }
    }, {
        "$addFields": {
          "historicalSpend": {
            "$arrayElemAt": [ "$profile.stats.totalMoneySpent", 0 ]
          },
          "totalPlayTimeLast7D": {
            "$arrayElemAt": [ "$profile.stats.totalGameTimeDays", 0 ]
          }
        }
    }, {
      "$addFields": {
        "playerId": "$_id.p",
        "characterId": "$_id.c",
        "updateDt": new Date()
      }
    }, {
      "$unset": [
        "profile",
        "_id"
      ]
    }, {
      "$lookup": {
        "from": "playerActivityLast7Days",
        "let": {
            "p": "$playerId",
            "c": "$characterId"
        },
        "pipeline": [{
          "$match": {
            "$expr": {
              "$and": [
                { "$eq": ["$playerId", "$$p"] },
                { "$eq": ["$characterId", "$$c"] }
              ]
            }
          }
        }],
        "as": "activity"
      }
    }, {
      "$match": {
        "activity": { "$gt": {"$size": 0}}
      }
    }, {
      "$unset": "activity"
    }, {
      "$addFields": {
        "updateDt": new Date()
      }
    }, {
      "$merge": {
        "into": "playerActivityForPersonalizedOffers",
        "on": [
          "playerId",
          "characterId"
        ],
        "whenMatched": "merge",
        "whenNotMatched": "insert"
      }
    }
  ];

  const aggrPipeline2 = [
    {
      "$match": {
        "playerId": activity.playerId,
        "characterId": activity.characterId
      }
    },
    {
      "$group": {
        "_id": {
          "p": "$playerId",
          "c": "$characterId",
          "e": "$equipmentType"
        },
        "count": {
          "$sum": "$amount"
        }
      }
    }, {
      "$group": {
        "_id": {
          "p": "$_id.p",
          "c": "$_id.c"
        },
        "p": {
          "$push": {
            "k": {
              "$concat": [
                "totalEquip",
                {
                  "$toUpper": { "$substr": [ "$_id.e", 0, 1 ] }
                },
                {
                  "$substr": [ "$_id.e", 1, { "$strLenBytes": "$_id.e" } ]
                },
                "Last7D"
              ]
            },
            "v": "$count"
          }
        }
      }
    }, {
      "$replaceWith": {
        "$mergeObjects": [
          { "playerId": "$_id" },
          { "$arrayToObject": "$p" }
        ]
      }
    }, {
      "$addFields": {
        "playerId": "$playerId.p",
        "characterId": "$playerId.c",
        "totalEquipsLast7D": {
          "$sum": [ "$totalEquipShardsLast7D", "$totalEquipLevelLast7D", "$totalEquipAbilityLast7D", "$totalEquipGearLast7D", 0 ]
        },
        "updateDt": new Date()
      }
    }, {
      "$merge": {
        "into": "playerActivityForPersonalizedOffers",
        "on": [ "playerId", "characterId" ],
        "whenMatched": "merge",
        "whenNotMatched": "insert"
      }
    }
  ];
  
  try {
    await rosterCollection.aggregate(aggrPipeline1).next();
    console.log("AGGR1");
    await last7daysCollection.aggregate(aggrPipeline2).next();
    console.log("AGGR2");
  } catch(err) {
    console.log("AGGR ERROR: " + err);
  }
}