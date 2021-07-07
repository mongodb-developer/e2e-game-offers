exports = async function(activity) {
  /*
   * This function accepts a player activity object and writes it to an activity file in S3. 
   * If a matching file for the player and time period (YYYY-MM) is found, the file will
   * be updated, otherwise a new file will be created in the bucket. It also updates the 
   * playerRoster and playerActivity7Days collections cia aggregation pipelines.
   *
   * Date          Version        Author            Notes
   * ---------------------------------------------------------------------
   * 2021-06-13    1.0            Roy Kiesler       Initial version. Separated from funcActivityGenerator for easier invocation from Unity client app
   * 2021-06-22.   1.1            Roy Kiesler       Added logic to increment number of stars based on activity
   */
   
  console.log("ACTIVITY RECEIVED: " + JSON.stringify(activity));
   
  // add timestamp to the activity
  let ts = new Date();
  if (null == activity.activityDt || undefined == null == activity.activityDt) {
    activity.activityDt = ts;
  }
   
  try {
    // update player roster, activity TTL, and activity for offers collections
    updatePlayerRosterAnd7DayActivity(activity);
  } catch (updErr) {
    console.log("UPDATE ERROR: " + updErr);
    throw updErr;
  }
  
  return {result: true};
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
    incObject = { $inc: { "roster.$.gearTier": newActivity.amount } };
  } else if (newActivity.equipmentType === "level") {
    incObject = { $inc: { "roster.$.level": newActivity.amount } };
  } else if (newActivity.equipmentType === "abilities") {
    incObject = { $inc: { "roster.$.abilities": newActivity.amount } };
  }
  
  let starsAggr = [
    {
      "$match": {
        "playerId": newActivity.playerId, 
        "roster.characterId": newActivity.characterId
      }
    }, {
      "$unwind": {
        "path": "$roster"
      }
    }, {
      "$match": {
        "roster.characterId": newActivity.characterId
      }
    }, {
      "$set": {
        "roster.stars": {
          "$switch": {
            "branches": [
              { "case": { "$gte": [ "$roster.shards", 810 ] }, "then": BSON.Int32(7) },
              { "case": { "$gte": [ "$roster.shards", 510 ] }, "then": BSON.Int32(6) },
              { "case": { "$gte": [ "$roster.shards", 310 ] }, "then": BSON.Int32(5) },
              { "case": { "$gte": [ "$roster.shards", 180 ] }, "then": BSON.Int32(4) },
              { "case": { "$gte": [ "$roster.shards", 100 ] }, "then": BSON.Int32(3) },
              { "case": { "$gte": [ "$roster.shards", 45 ] },  "then": BSON.Int32(2) },
              { "case": { "$gte": [ "$roster.shards", 15 ] },  "then": BSON.Int32(1) }
            ], 
            "default": 1
          }
        }
      }
    }
  ];
  
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
        { session, returnNewDocument: true }
      );
      
      // increment the number of stars
      modifiedRoster = await rosterCollection.aggregate(starsAggr, { session, returnNewDocument: true } ).next();
      modifiedRoster = await rosterCollection.findOneAndUpdate(
        { "playerId": modifiedRoster.playerId, "roster.characterId": modifiedRoster.roster.characterId },
        { $set: { "roster.$.stars": modifiedRoster.roster.stars } },
        { session }
      );

      // add the new activity
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
    console.log(`CATCH: ${err} | ABORT`);
    await session.abortTransaction();
    
    // no match -- either no document for current playerId or no activity for characterId
    //             try matching on playerId only and add an activity to the roster array
    /****
     * temporarily commented out
     * --------------------------
    try {
      await session.withTransaction(async () => {
        let newRosterEntry = {
          characterId: BSON.Int32(newActivity.characterId),
          level: BSON.Int32(1),
          gear_tier: BSON.Int32(1),
          shards: newActivity.equipmentType === "shards" ? BSON.Int32(newActivity).amount : BSON.Int32(0),
          stars: BSON.Int32(0),
          redStars: BSON.Int32(0),
          abilities: newActivity.equipmentType === "abilities" ? BSON.Int32(newActivity.amount) : BSON.Int32(0)
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
    } */ // end temporary comment out
  } finally {
    // Step 6: End the session when you complete the transaction
    await session.endSession();
  }
}