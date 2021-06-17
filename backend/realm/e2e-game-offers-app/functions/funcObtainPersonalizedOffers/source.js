exports = async function(changeEvent) {
  /*
   * This function will build the payload and call the ML API to obtain personalized offers 
   *
   * Date          Version        Author            Notes
   * --------------------------------------------------------------
   * 2021-05-23    1.0            Sig Narvaez       Initial version
   * 2021-06-02    1.1            Sig Narvaez       ML call
   * 2021-06-11    1.2            Sig Narvaez       Store created Offers in PPO log document. 
   *                                                This supports tracing on offer purchase or expiry for re-inforced learning
   */
   
  const doc = changeEvent.fullDocument;
   
  console.log("Activity triggered a personalized offer: ", JSON.stringify(changeEvent));
  
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const playerOffersColl = db.collection("playerOffers");
  const ppoLogColl = db.collection("playerPersonalizedOffersLog");
  
  const playerId = changeEvent.fullDocument.playerId;
  const characterId = changeEvent.fullDocument.characterId;
  
  // Abort if there are already offers for this player/character
  if (await playerOffersColl.findOne({"playerId": playerId, "characterId": characterId}))
  {
    console.log("Offers already exist for this player/character. Aborting call to ML. " + JSON.stringify({"playerId": playerId, "characterId": characterId}));
    return;
  }
  
  const payloadForML = await buildPayloadForML(changeEvent);
  
  const responseFromML = await callAutoML(payloadForML);
  
  const offers = await createPlayerOffers(playerId, characterId, responseFromML, playerOffersColl);
  
  const ppoLog = {
    "activity":       changeEvent.fullDocument,
    "payloadForML":   payloadForML,
    "responseFromML": responseFromML,
    "offers" : offers,
    activityDt: new Date()
  }

  console.log("ppoLog ", JSON.stringify(ppoLog));
  
  const newDoc = ppoLogColl.insertOne(ppoLog); 
}

async function buildPayloadForML(changeEvent) {
  
  // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const ppoLogColl        = db.collection("playerPersonalizedOffersLog");
  const playerProfileColl = db.collection("playerProfile");
  const playerRosterColl  = db.collection("playerRoster");
  
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
    gearTier               : character.gearTier,
    level                   : character.level,
    nextRankIsRedStar       : changeEvent.fullDocument.isNextRankARedStar,
    characterGrade          : getCharacterGrade(changeEvent.fullDocument.characterId),
    redStars                : character.redStars,
    stars                   : character.stars,
    historicalSpend         : changeEvent.fullDocument.historicalSpend,
    weekDayOfPurchase       : new Date().getDay()+1 // 1-7
  }
  
  // Assemble paylod for ML API call
  /*
  const payloadForML = {
    "payload": {
      "row": {
        "values": [
          {"numberValue": values.totalEquipsLast7D},
          {"numberValue": values.characterId},
          {"numberValue": values.shards},
          {"numberValue": values.totalPlayTimeLast7D},
          {"numberValue": values.abilities},
          {"numberValue": values.totalEquipShardsLast7D},
          {"numberValue": values.gearTier},
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
          "5243538517270724608",  // gearTier              Source: playerRoster[roser.charactedId = characterId]
          "5819999269574148096",  // level                  Source: playerRoster[roser.charactedId = characterId]
          "8125842278787842048",  // nextRankIsRedStar      Source: playerActivityForPersonalizedOffers 
          "5531768893422436352",  // Character Grade A-C    Source: playerRoster[roser.charactedId = characterId]. "A" (1,5 & 9) "B" (2,6, & 10) "C" (3,7 & 11) "D" (4,8 & 12) 
          "7261151150332706816",  // Red Stars              Source: playerRoster[roser.charactedId = characterId]
          "1208313251146760192",  // Stars                  Source: playerRoster[roser.charactedId = characterId]
          "8414072654939553792",  // historicalSpend        Source: playerActivityForPersonalizedOffers
          "6108229645725859840"   // weekDayOfPurchase      Source: Weekday of Date.now() when calling model
        ]
      }
    }
  };
  */
  const payloadForML = {
    "payload": {
      "row": {
        "values": [
          values.totalEquipsLast7D.toString(),
          values.characterId.toString(),
          values.shards.toString(),
          values.totalPlayTimeLast7D.toString(),
          values.abilities.toString(),
          values.totalEquipShardsLast7D.toString(),
          values.gearTier.toString(),
          values.level.toString(),
          values.nextRankIsRedStar.toString(),
          values.characterGrade,
          values.redStars.toString(),
          values.stars.toString(),
          values.historicalSpend.toString(),
          values.weekDayOfPurchase.toString()
        ],
        "columnSpecIds": [
          "3802386636512165888",  // totalEquipsLast7D      Source: playerActivityForPersonalizedOffers
          "1496543627298471936",  // characterId (1 - 12)   Source: playerActivityForPersonalizedOffers
          "920082874995048448",   // shards                 Source: playerActivityForPersonalizedOffers
          "631852498843336704",   // totalPlayTimeLast7D    Source: playerActivityForPersonalizedOffers
          "3225925884208742400",  // abilities              Source: playerRoster[roser.charactedId = characterId]
          "2937695508057030656",  // TotalEquipShardsLast7D Source: playerActivityForPersonalizedOffers
          "5243538517270724608",  // gearTier              Source: playerRoster[roser.charactedId = characterId]
          "5819999269574148096",  // level                  Source: playerRoster[roser.charactedId = characterId]
          "8125842278787842048",  // nextRankIsRedStar      Source: playerActivityForPersonalizedOffers 
          "5531768893422436352",  // Character Grade A-C    Source: playerRoster[roser.charactedId = characterId]. "A" (1,5 & 9) "B" (2,6, & 10) "C" (3,7 & 11) "D" (4,8 & 12) 
          "7261151150332706816",  // Red Stars              Source: playerRoster[roser.charactedId = characterId]
          "1208313251146760192",  // Stars                  Source: playerRoster[roser.charactedId = characterId]
          "8414072654939553792",  // historicalSpend        Source: playerActivityForPersonalizedOffers
          "6108229645725859840"   // weekDayOfPurchase      Source: Weekday of Date.now() when calling model
        ]
      }
    }
  };
  
  console.log("Payload for ML ", JSON.stringify(payloadForML));
  
  return payloadForML;
}

async function callAutoML(payload) {
  
  const accessToken = context.values.get("gcp-svc-acct-access-token"); 
  console.log(accessToken);
  
  const http = context.services.get("web");
  
  return http.post({
      url: "https://automl.googleapis.com/v1beta1/projects/e2e-game-offers/locations/us-central1/models/TBL6662871139531882496:predict",
      body: payload,
      headers: {
        "Content-Type": ["application/json"],
        "Authorization": ["Bearer " + accessToken]
      },
      encodeBodyAsJSON: true
    })
    .then(response => {
      console.log("ML RESPONSE: " + response.body.text());
      return JSON.parse(response.body.text());
    });
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

function getOfferShardsAndPrice(offerId) {
  switch (offerId) {
    case 1: return { shards: 50, price: 29.99 }
    case 2: return { shards: 50, price: 19.99 }
    case 3: return { shards: 30, price:  9.99 }
    case 4: return { shards: 50, price:  9.99 }
    case 5: return { shards: 75, price:  4.99 }
    default: return { shards: 0, price:  0 }
  }
}

async function createPlayerOffers(playerId, characterId, responseFromML, playerOffersColl) {
  
  const top2 = responseFromML.payload.sort((a, b) => (a.tables.score > b.tables.score) ? -1 : 1);
  
  var result = [];

  // Only offer the top 2 ranked offers
  for(var i= 0; i < 2; i++)
  {
    const offerId = parseInt(top2[i].tables.value);
    const offerShardsAndPrice = getOfferShardsAndPrice(offerId);
    
    try {
      const newPO = await playerOffersColl.insertOne(
        {
          "playerId":         playerId,
          "characterId":      BSON.Int32(characterId),
          "offerId":          BSON.Int32(offerId),
          "shards":           offerShardsAndPrice.shards,
          "price":            offerShardsAndPrice.price,
          "predictionScore":  top2[i].tables.score,
          "predictionDt":     new Date(),
          "isPurchased":      false,
          "purchaseDt":       null
        });
      
      result.push(newPO);
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }
  
  return result;
}