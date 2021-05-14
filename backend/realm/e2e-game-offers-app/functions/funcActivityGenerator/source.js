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
  const minPlayerId = 1000;
  const maxPlayerId = 9999;
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
  let activity = {
    "playerId": Math.floor(Math.random() * (maxPlayerId - minPlayerId) + minPlayerId),
    "characterId": Math.floor(Math.random() * (maxCharacterId - minCharacterId) + minCharacterId),
    "equipmentType": equip,
    "amount": (equip == "shards" ? Math.floor(Math.random() * (5 - 1) + 1) : 1), // 1 if level, abilities or gear. Random (1-5) if shards.
    "timestamp": ts
  };

  // write activity to database
  const collection = context.services.get("mongodb-atlas").db("game").collection("playerActivity");
  collection.insertOne(activity);

  // write to S3
  const s3bucket = context.values.get("e2eS3Bucket"); // e2eS3BucketRK
  const filename = `${activity.playerId}-${activity.characterId}-${ts.getFullYear()}-${ts.getMonth().toString().padStart(2, '0')}.json`;  // PlayerId-CharacterId-YYYY-MM

  // does this file exist in S3 already?
  try {
    // Set the parameters
    const getParams = {
      Bucket: s3bucket,
      Key: filename
    };
    
    s3.getObject({ 'Bucket': s3bucket, 'Key': filename }, (err, data) => {
      // Handle any error and exit
      if (err) {
        //console.log(`${filename} not found...`);
        let activities = [activity];
        //console.log("Writing activity to S3...");
        
        const putParams = {
          "Bucket": s3bucket,
          "Key": filename,
          "Body": JSON.stringify(activities, null, 2),
          "ContentType": "application/json"
        };
        
        try {
          s3.putObject(putParams, (err, data) => {
            // Handle any error and exit
            if (err) {
                console.log("PutObject error", err.toString('utf-8'));
                return err;
            }
      
            // No error happened
            //console.log(`${filename} updated...`);
          });
        } catch(putErr) {
          errProps = Object.keys(getErr);
          console.log("INSERT: " + errProps);
        }
      } else {
        // No error happened
        //console.log(`${filename} found...`);
          
        // Convert Body from a Buffer to a String
        let objectData = data.Body.toString('utf-8');
        //console.log(objectData);
        let activities = JSON.parse(objectData);
        //console.log("CURRENT: " + activities);
        if (Array.isArray(activities) && activities.length > 0) {
          activities.push(activity);
          //console.log("NEXT: " + activities);
          //console.log("Writing activity to S3...");
            
          const putParams = {
            "Bucket": s3bucket,
            "Key": filename,
            "Body": JSON.stringify(activities, null, 2),
            "ContentType": "application/json"
          };
            
          try {
            s3.putObject(putParams, (err, data) => {
              // Handle any error and exit
              if (err) {
                  console.log("PutObject error", err.toString('utf-8'));
                  return err;
              }
        
              // No error happened
              console.log(`${filename} updated...`);
            });
          } catch (putErr) {
            errProps = Object.keys(getErr);
            console.log("UPDATE: " + errProps);
          }
        } else {
          console.log("This shouldn't happen -- activities isn't an array");
        }
      }
    });
  } catch (getErr) {
    console.log("GET ERROR: " + getErr);
    // another S3 getObject error
    throw getErr;
  }
};
