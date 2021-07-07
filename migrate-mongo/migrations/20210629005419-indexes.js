module.exports = {
  async up(db, client) {
    await db.collection('playerProfile').createIndex(
      {
          "playerId" : 1
      },
      {
          "name" : "playerId_1",  
          "unique" : true
      }
    );

    await db.collection('playerRoster').createIndex(
      {
          "playerId" : 1,
          "roster.characterId" : 1
      },
      {
          "name" : "playerId_1_roster.characterId_1",  
          "unique" : true
      }
    );

    await db.collection('playerOffers').createIndex(
      {
          "playerId" : 1,
          "characterId" : 1,
          "offerId" : 1
      },
      {
          "name" : "playerId_1_characterId_1_offerId_1",  
          "unique" : true
      }
    );

    await db.collection('playerOffers').createIndex(
      {
          "predictionDt" : 1
      },
      {
          "name" : "predictionDt_1",  
          "expireAfterSeconds" : 172800
      }
    );

    await db.collection('playerActivityLast7Days').createIndex(
      {
          "playerId" : 1,
          "characterId" : 1
      },
      {
          "name" : "playerId_1_characterId_1"
      }
    );

    await db.collection('playerActivityLast7Days').createIndex(
      {
          "activityDt" : 1
      },
      {
          "name" : "activityDt_1",  
          "expireAfterSeconds" : 604800
      }
    );

    await db.collection('playerActivityForPersonalizedOffers').createIndex(
      {
          "playerId" : 1,
          "characterId" : 1
      },
      {
          "name" : "playerId_1_characterId_1",  
          "unique" : true
      }
    );

    await db.collection('playerPersonalizedOffersLog').createIndex(
      {
          "activityDt" : 1
      },
      {
          "name" : "activityDt_1",  
          "expireAfterSeconds" : 172800
      }
    );  
    
    await db.collection('playerPersonalizedOffersLog').createIndex(
      {
          "offers.insertedId" : 1
      },
      {
          "name" : "offers.insertedId_1"
      }
    );

  },

  async down(db, client) {
    await db.collection('playerProfile').dropIndex("playerId_1");

    await db.collection('playerRoster').dropIndex("playerId_1_roster.characterId_1");

    await db.collection('playerOffers').dropIndex("playerId_1_characterId_1_offerId_1");

    await db.collection('playerOffers').dropIndex("predictionDt_1");

    await db.collection('playerActivityLast7Days').dropIndex("playerId_1_characterId_1");

    await db.collection('playerActivityLast7Days').dropIndex("activityDt_1");

    await db.collection('playerActivityForPersonalizedOffers').dropIndex("playerId_1_characterId_1");

    await db.collection('playerPersonalizedOffersLog').dropIndex("activityDt_1");  
    
    await db.collection('playerPersonalizedOffersLog').dropIndex("offers.insertedId_1");
  }
};
