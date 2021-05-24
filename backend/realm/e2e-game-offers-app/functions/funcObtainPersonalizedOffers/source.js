exports = async function(changeEvent) {
  /*
   * This function will build the payload and call the ML API to obtain personalized offers 
   *
   * Date          Version        Author            Notes
   * --------------------------------------------------------------
   * 2021-05-23    1.0            Sig Narvaez       Initial version
   *
   */
  
  // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const ppoLogColl        = db.collection("playerPersonalizedOffersLog");
  const playerProfileColl = db.collection("playerProfile");
  const playerRosterColl  = db.collection("playerRoster");
  
  console.log("Activity triggered a personalized offer ", JSON.stringify(changeEvent));
  
  playerProfile = await playerProfileColl.findOne({"playerId": changeEvent.fullDocument.playerId});
  playerRoster  = await playerRosterColl.findOne({"playerId": changeEvent.fullDocument.playerId});
  const character = await playerRoster.roster.find( ({ characterId }) => characterId === changeEvent.fullDocument.characterId );
      
  console.log("Player Profile ", JSON.stringify(playerProfile));
  console.log("Player Roster ", JSON.stringify(playerRoster));
  console.log("Character ", JSON.stringify(character));
  
  // Get values from change document or database
  const values = {
    totalEquipsLast7D       : changeEvent.fullDocument.totalEquipsLast7D,        
    characterId             : changeEvent.fullDocument.characterId,    
    shards                  : character.shards,                       
    totalPlayTimeLast7D     : changeEvent.fullDocument.totalPlayTimeLast7D,
    abilities               : character.abilities,
    totalEquipShardsLast7D  : changeEvent.fullDocument.totalEquipsLast7D, // TO-DO
    gear_tier               : character.gear_tier,
    level                   : character.level,
    nextRankIsRedStar       : changeEvent.fullDocument.nextRankIsRedStar,
    characterGrade          : getCharacterGrade(changeEvent.fullDocument.characterId),
    redStars                : character.redstars,
    stars                   : character.stars,
    historicalSpend         : changeEvent.fullDocument.historicalSpend,
    weekDayOfPurchase       : new Date().getDay()+1 // 1-7
  }
  
  // Assemble paylod for ML API call
  const payloadForML = {
    "row": {
      "values": [
        {"numberValue": values.totalEquipsLast7D},
        {"numberValue": values.characterId},
        {"numberValue": values.shards},
        {"numberValue": values.totalPlayTimeLast7D},
        {"numberValue": values.abilities},
        {"numberValue": values.totalEquipShardsLast7D},
        {"numberValue": values.gear_tier},
        {"numberValue": values.level},
        {"boolValue":   values.nextRankIsRedStar},
        {"stringValue": values.characterGrade},
        {"numberValue": values.redStars},
        {"numberValue": values.stars},
        {"numberValue": values.historicalSpend},
        {"numberValue": values.weekDayOfPurchase}
      ],
      "columnSpecIds": [
        "3802386636512165888",  // totalEquipsLast7D      Source: playerActivityForPersonalizedOffers
        "1496543627298471936",  // characterId (1 - 12)   Source: playerActivityForPersonalizedOffers
        "920082874995048448",   // shards                 Source: playerActivityForPersonalizedOffers
        "631852498843336704",   // totalPlayTimeLast7D    Source: playerActivityForPersonalizedOffers
        "3225925884208742400",  // abilities              Source: playerRoster[roser.charactedId = characterId]
        "2937695508057030656",  // TotalEquipShardsLast7D Source: playerActivityForPersonalizedOffers
        "5243538517270724608",  // gear_tier              Source: playerRoster[roser.charactedId = characterId]
        "5819999269574148096",  // level                  Source: playerRoster[roser.charactedId = characterId]
        "8125842278787842048",  // nextRankIsRedStar      Source: playerActivityForPersonalizedOffers 
        "5531768893422436352",  // Character Grade A-C    Source: playerRoster[roser.charactedId = characterId]. "A" (1,5 & 9) "B" (2,6, & 10) "C" (3,7 & 11) "D" (4,8 & 12) 
        "7261151150332706816",  // Red Stars              Source: playerRoster[roser.charactedId = characterId]
        "1208313251146760192",  // Stars                  Source: playerRoster[roser.charactedId = characterId]
        "8414072654939553792",  // historicalSpend        Source: playerActivityForPersonalizedOffers
        "6108229645725859840"   // weekDayOfPurchase      Source: Weekday of Date.now() when calling model
      ]
    }
  };
  
  console.log("Payload for ML ", JSON.stringify(payloadForML));

  const doc = ppoLogColl.insertOne(payloadForML);
  
  //TO-DO Call ML API to obtain set and ranking for personalized offers
  
}

function getCharacterGrade(characterId) {
  switch (characterId) {
    case 1:
    case 5:
    case 9:
      return "A";
    case 2:
    case 6:
    case 10:
      return "B";
    case 3:
    case 7:
    case 11:
      return "C";
    case 4:
    case 8:
    case 12:
      return "D"
    default:
      return "Z";
  }
}