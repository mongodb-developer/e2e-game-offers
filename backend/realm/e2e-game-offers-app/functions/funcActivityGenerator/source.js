exports = async function() {
  /*
   * This function will generate a player activity and write it to an activity file in S3. 
   * If a matching file for the player and time period (YYYY-MM) is found, the file will
   * be updated, otherwise a new file will be created in the bucket.
   *
   * Date          Version        Author            Notes
   * ---------------------------------------------------------------------
   * 2021-05-13    1.0            Roy Kiesler       Initial version
   * 2021-05-24    1.1            Roy Kiesler       Added multi-iteration
   * 2021-06-16.   1.2            Roy Kiesler       Separated activity generation from S3 persistence and Atlas aggregations
   *
   */
  
  //const BSON = require('bson');
  
  // # of activities
  const numActivitiesToGenerate = parseInt(context.values.get("NUM_ACTIVITIES_TO_GENERATE")) || 1;

  // Set the Credentials, Region
  const AWS = require('aws-sdk');
  AWS.config.update({
    accessKeyId: context.values.get("ACCESS_KEY_ID"),
    secretAccessKey: context.values.get("SECRET_ACCESS_KEY_VAR"),
    region: "us-west-1",
  });

  // Create S3 service object
  s3 = new AWS.S3({apiVersion: '2006-03-01'});

  // Generate a player activity
  const minCharacterId = 1;
  const maxCharacterId = 16;
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
  
  for (let i=0; i < numActivitiesToGenerate; i++) {
    
    // ==== RANDOM PLAYER FROM 10K coll ====
    // pick a random e-mail from the 10K email collection
    //let randomPlayer = await collection.aggregate([{ "$sample": { "size": 1 } }]).next();
    
    // ==== DEMO PLAYERS ====
    const demoPlayers = ["sig@leafsquad.com","nic@leafsquad.com","roy@leafsquad.com","charles@leafsquad.com","andrew@leafsquad.com","beau@leafsquad.com"];
    let randomPlayer = {"email": demoPlayers[Math.floor(Math.random()*demoPlayers.length)] };
  
    // generate a new activity
    let activity = {
      "playerId": randomPlayer.email,
      //"characterId": Math.floor(Math.random() * (maxCharacterId - minCharacterId) + minCharacterId),
      "characterId": BSON.Int32(Math.floor(Math.random() * (maxCharacterId - minCharacterId) + minCharacterId)),
      "equipmentType": equip,
      "amount": (equip == "shards" ? BSON.Int32(Math.floor(Math.random() * (5 - 1) + 1)) : BSON.Int32(1)), // 1 if level, abilities or gear. Random (1-5) if shards.
      "activityDt": ts
    };
    
    // aggregate on the last iteration
    let aggrFlag = (i === numActivitiesToGenerate-1) ? true : false;
    try {
      console.log("Calling funcAddActivity...");
      await context.functions.execute("funcAddActivity", activity, aggrFlag);
      console.log("Activity saved successfully.");
    } catch(err) {
      console.log("funcAddActivity ERROR: " + err);
    }
  } // end for
};
