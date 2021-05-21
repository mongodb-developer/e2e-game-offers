exports = async function() {
  /*
   * This function will generate a player activity and write it to an activity file in S3. 
   * If a matching file for the player and time period (YYYY-MM) is found, the file will
   * be updated, otherwise a new file will be created in the bucket.
   *
   * Date          Version        Author            Notes
   * --------------------------------------------------------------
   * 2021-05-13    1.0            Roy Kiesler       Initial version
   *
   */
   
  const AWS = require('aws-sdk');

  // Set the Credentials, Region
  AWS.config.update({
    accessKeyId: context.values.get("ACCESS_KEY_ID"),
    secretAccessKey: context.values.get("SECRET_ACCESS_KEY_VAR"),
    region: "us-west-1",
  });

  // Create S3 service object
  s3 = new AWS.S3({apiVersion: '2006-03-01'});

  // Generate a player activity
  const minCharacterId = 1;
  const maxCharacterId = 12;
  const equipmentTypes = {
    "shards": 50,
    "gear": 35,
    "level": 10,
    "abilities": 5
  };
  
  // Make a weighted random selection of equipment types
  function getEquipmentType() {
    let array = [];
    
    // the weighted part...
    for (let type in equipmentTypes) {
        if ( equipmentTypes.hasOwnProperty(type) ) { // safety
            for( var i=0; i < equipmentTypes[type]; i++ ) {
                array.push(type);
            }
        }
    }
    // the random part...
    return array[Math.floor(Math.random() * array.length)];
  }
  
  let equip = getEquipmentType();
  let ts = new Date();
  
  // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const collection = db.collection("playerEmails");
  
  // pick a random e-mail from the 10K email collection
  let randomPlayer = await collection.aggregate([{ "$sample": { "size": 1 } }]).next();

  // generate a new activity
  let activity = {
    "playerId": randomPlayer.email,
    "characterId": Math.floor(Math.random() * (maxCharacterId - minCharacterId) + minCharacterId),
    "equipmentType": equip,
    "amount": (equip == "shards" ? Math.floor(Math.random() * (5 - 1) + 1) : 1), // 1 if level, abilities or gear. Random (1-5) if shards.
    "timestamp": ts
  };

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
    
    // update player roster, activity TTL, and activity for offers collections
    updatePlayerRosterAnd7DayActivity(activity);
    aggregateActivitiesForOffers();
  } catch (getErr) {
    console.log("GET ERROR: " + getErr);
    // another S3 getObject error
    throw getErr;
  }
};

async function updatePlayerRosterAnd7DayActivity(newActivity) {
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const rosterCollection = db.collection("playerRoster");
  const activityCollection = db.collection("playerActivityLast7Days");

  // Step 1: Start a Client Session
  const session = client.startSession();
  
  // Step 2: Define options to use for the transaction (optional)
  const transactionOptions = {
    readPreference: "primary",
    readConcern: { level: "local" },
    writeConcern: { w: "majority" },
  };
  
  let incObject;
  if(newActivity.equipmentType === "shards") {
    incObject = { $inc: { "roster.$.shards": newActivity.amount } };
  } else if (newActivity.equipmentType === "gear") {
    incObject = { $inc: { "roster.$.gear": newActivity.amount } };
  } else if (newActivity.equipmentType === "level") {
    incObject = { $inc: { "roster.$.level": newActivity.amount } };
  } else if (newActivity.equipmentType === "abilities") {
    incObject = { $inc: { "roster.$.abilities": newActivity.amount } };
  }
  
  // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
  // Note: The callback for withTransaction MUST be async and/or return a Promise.
  try {
    let modifiedRoster, insertedActivity;
    console.log(`NEW ACTIVITY: ${JSON.stringify(newActivity)}`);
    await session.withTransaction(async () => {
      // Step 4: Execute the queries you would like to include in one atomic transaction
      // Important:: You must pass the session to the operations
      modifiedRoster = await rosterCollection.findOneAndUpdate(
        { "playerId": newActivity.playerId, "roster.characterId": newActivity.characterId },
        incObject,
        { session }
      );
      insertedActivity = await activityCollection.insertOne(
        newActivity,
        { session }
      );
    }, transactionOptions);
    console.log(`MOD: ${JSON.stringify(incObject)}`);
    console.log(`MOD: ${JSON.stringify(modifiedRoster)}`);
    console.log("INS: " + JSON.stringify(insertedActivity));
  } catch (err) {
    // Step 5a: Handle errors with a transaction abort
    console.log(`CATCH: ${err}`);
    await session.abortTransaction();
    
    // no match -- either no document for current playerId or no activity for characterId
    //             try matching on playerId only and add an activity to the roster array
    try {
      await session.withTransaction(async () => {
        let newRosterEntry = {
          characterId: newActivity.characterId,
          level: 1,
          gear_tier: 1,
          shards: newActivity.equipmentType === "shards" ? newActivity.amount : 0,
          starts: 0,
          redstars: 0,
          abilities: newActivity.equipmentType === "abilities" ? newActivity.amount : 0
        };
        console.log(`1ST INS: ${newActivity.playerId} ${JSON.stringify(newRosterEntry)}`);
        modifiedRoster = await rosterCollection.findOneAndUpdate(
          { "playerId": newActivity.playerId },
          { $push: { "roster": newRosterEntry } },
          { session }
        );
        insertedActivity = await activityCollection.insertOne(
          newActivity,
          { session }
        );
      });
    } catch (err) {
      // Step 5b: Handle errors with a transaction abort
      console.log(`RETRY CATCH: ${err}`);
      await session.abortTransaction();
    }
  } finally {
    // Step 6: End the session when you complete the transaction
    await session.endSession();
  }
}

async function aggregateActivitiesForOffers() {
    // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const rosterCollection = db.collection("playerRoster");
  const last7daysCollection = db.collection("playerActivityLast7Days");

  const aggrPipeline1 = [
    {
      "$unwind": { "path": "$roster" }
    }, {
      "$addFields": {
        "nextRankIsRedStar": { "$gt": [ "$roster.redstars", "$roster.stars" ] }
      }      
    }, {
      "$group": {
        "_id": {
            "p": "$playerId",
            "c": "$roster.characterId",
            "n": '$nextRankIsRedStar'
        },
        "totalShards": {
            "$sum": "$roster.shards"
        }
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
        "nextRankIsRedStar": "$_id.n"
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
        "historicalSpend": { "$arrayElemAt": [ "$profile.stats.total_money_spent", 0 ] },
        "totalPlayTimeLast7D": { "$arrayElemAt": [ "$profile.stats.total_game_time_days", 0 ] }
      }
    }, {
      "$addFields": {
        "playerId": "$_id.p",
        "characterId": "$_id.c"
      }
    }, {
      "$unset": [ "profile", "_id" ]
    }, {
      "$merge": {
        "into": "playerActivityForPersonalizedOffers",
        "on": [ "playerId", "characterId" ],
        "whenMatched": "merge",
        "whenNotMatched": "insert"
      }
    }
  ];
  const aggrPipeline2 = [
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
          "$add": [
            { "$ifNull": [ "$totalEquipShardsLast7D", 0 ] },
            { "$ifNull": [ "$totalEquipLevelLast7D", 0 ]},
            { "$ifNull": [ "$totalEquipAbilityLast7D", 0 ] },
            { "$ifNull": [ "$totalEquipGearLast7D", 0 ] }
          ]
        }
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