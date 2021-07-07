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
   * 2021-06-22    1.2            Sig Narvaez       add state at inference for latter re-training purposes
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
  if (await playerOffersColl.findOne({"playerId": playerId, "characterId": characterId, "isPurchased": false}))
  {
    console.log("Offers already exist for this player/character. Aborting call to ML. " + JSON.stringify({"playerId": playerId, "characterId": characterId}));
    return;
  }
  
  const stateAtInference = await buildStateAtInference(changeEvent);
  
  const payloadForML = await buildPayloadForML(stateAtInference);
  
  const responseFromML = await callAutoML(payloadForML);
  
  const offers = await createPlayerOffers(playerId, characterId, responseFromML, playerOffersColl);
  
  // Race condition. It is possible another concurrent acitivity inserted offers first 
  if (!offers.length) return;
  
  const ppoLog = {
    "activity":         changeEvent.fullDocument,
    "stateAtInference": stateAtInference,
    "payloadForML":     payloadForML,
    "responseFromML":   responseFromML,
    "offers" : offers,
    activityDt: new Date()
  }

  console.log("ppoLog ", JSON.stringify(ppoLog));
  
  const newDoc = ppoLogColl.insertOne(ppoLog); 
}

async function buildStateAtInference(changeEvent) {
  // DB access
  const client = context.services.get("mongodb-atlas");
  const db = client.db("game");
  const playerProfileColl = db.collection("playerProfile");
  const playerRosterColl  = db.collection("playerRoster");
  
  playerProfile = await playerProfileColl.findOne({"playerId": changeEvent.fullDocument.playerId});
  playerRoster  = await playerRosterColl.findOne({"playerId": changeEvent.fullDocument.playerId});
  const character = await playerRoster.roster.find( ({ characterId }) => characterId === changeEvent.fullDocument.characterId );
      
  console.log("Player Profile ", JSON.stringify(playerProfile));
  console.log("Player Roster ", JSON.stringify(playerRoster));
  console.log("Character ", JSON.stringify(character));
  
  // Get values from change document or database
  const state = {
    totalEquipsLast7D       : changeEvent.fullDocument.totalEquipsLast7D,        
    characterId             : changeEvent.fullDocument.characterId,    
    shards                  : character.shards,                       
    totalPlayTimeLast7D     : changeEvent.fullDocument.totalPlayTimeLast7D,
    abilities               : character.abilities,
    totalEquipShardsLast7D  : changeEvent.fullDocument.totalEquipsLast7D, // TO-DO
    gearTier                : character.gearTier,
    level                   : character.level,
    nextRankIsRedStar       : changeEvent.fullDocument.isNextRankARedStar,
    characterGrade          : getCharacterGrade(changeEvent.fullDocument.characterId),
    redStars                : character.redStars,
    stars                   : character.stars,
    historicalSpend         : changeEvent.fullDocument.historicalSpend,
    weekDayOfPurchase       : new Date().getDay()+1, // Day 1-7
    shardsToNextRank        : changeEvent.fullDocument.shardsToNextRank 
  }
  
  return state;
}

async function buildPayloadForML(values) {
  // Assemble paylod for ML API call
  
  // ML MODEL TBL3991779163664023552
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
          values.characterGrade.toString(),
          values.redStars.toString(),
          values.stars.toString(),
          values.historicalSpend.toString(),
          values.weekDayOfPurchase.toString(),
          values.shardsToNextRank.toString()
        ],
        "columnSpecIds": [
          "3349546175542853632",  // totalEquipsLast7D      Source: playerActivityForPersonalizedOffers
          "2196624670936006656",  // characterId (1 - 16)   Source: playerActivityForPersonalizedOffers
          "106954443836096512",   // shards                 Source: playerActivityForPersonalizedOffers
          "9114153698577088512",  // totalPlayTimeLast7D    Source: playerActivityForPersonalizedOffers
          "5655389184756547584",  // abilities              Source: playerRoster[roser.charactedId = characterId]
          "7961232193970241536",  // TotalEquipShardsLast7D Source: playerActivityForPersonalizedOffers
          "6808310689363394560",  // gearTier               Source: playerRoster[roser.charactedId = characterId]
          "1043703166329159680",  // level                  Source: playerRoster[roser.charactedId = characterId]
          "2412797453049790464",  // nextRankIsRedStar      Source: playerActivityForPersonalizedOffers 
          "8177404976084025344",  // Character Grade 1-4    Source: playerRoster[roser.charactedId = characterId]
          "3565718957656637440",  // Red Stars              Source: playerRoster[roser.charactedId = characterId]
          "7024483471477178368",  // Stars                  Source: playerRoster[roser.charactedId = characterId]
          "4502467680149700608",  // historicalSpend        Source: playerActivityForPersonalizedOffers
          "4718640462263484416",  // weekDayOfPurchase      Source: Weekday of Date.now() when calling model
          "5871561966870331392"   // shardsToNextRank       Source: playerActivityForPersonalizedOffers
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
      url: "https://automl.googleapis.com/v1beta1/projects/e2e-game-offers/locations/us-central1/models/TBL3991779163664023552:predict", // Chaffin's Model
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

function getCharacterGrade(characterId) {
  switch (characterId) {
    case 1:
    case 5:
    case 9:
    case 13:
      return 1; // A
    case 2:
    case 6:
    case 10:
    case 14:
      return 2; // B
    case 3:
    case 7:
    case 11:
    case 15:
      return 3; // C
    case 4:
    case 8:
    case 12:
    case 16:
      return 4; // D
    default:
      return 0;
  }
}

function getOfferShardsAndPrice(offerId) {
  switch (offerId) {
    case 1: return { shards: 100, price: 29.99 }
    case 2: return { shards:  50, price: 19.99 }
    case 3: return { shards:  30, price: 14.99 }
    case 4: return { shards:  20, price:  9.99 }
    case 5: return { shards:  10, price:  4.99 }
    default: return { shards:  0, price:  0 }
  }
}