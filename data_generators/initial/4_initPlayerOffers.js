//Initialize Player Offers
const mgenerate = require("mgeneratejs");
const MongoClient = require('mongodb').MongoClient;
const NumberInt = require("mongodb").Int32; // https://stackoverflow.com/questions/56814654/whats-the-equivalent-of-numberint-from-the-mongo-shell-in-client-javascript


main().catch(console.error);

async function main() {

    //const uri = "mongodb+srv://main_game_user:main_game_user**@game-main.maftg.mongodb.net/game";
    const uri = "mongodb://localhost:27017/game";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {

        await client.connect();

        await insertOffersInBulk(client)
            .catch(console.error);

    } finally {
        client.close();
    }
}

// Generate and Insert 1 offer per Player
async function insertOffersInBulk(client) {

    const playerProfileColl = client.db("game").collection("playerProfile");
    const playerOffersColl = client.db("game").collection("playerOffers");
    const playerOffersBulk = playerOffersColl.initializeOrderedBulkOp();

    // NOTE - THIS DELETES ALL DOCUMENTS IN THE [playerOffers] COLLECTION
    deleteMany = await playerOffersColl.deleteMany({});

    cursor = await playerProfileColl.find({});

    while (playerProfile = await cursor.next()) {
        console.log(new Date().toISOString() + " " + playerProfile.playerId);
        playerOffersBulk.insert(generateOffer(playerProfile.playerId));
    }

    await playerOffersBulk.execute();
}

function generateOffer(playerId) {

    const playerOfferTemplate = {
        playerId:           "$email",
        characterId:        {"$natural":  {"min":1, "max":12}},
        offerId:            {"$choose":   {"from": [1,2,3,4,5], "weights": [10, 40, 35, 10, 5]}},
        shards:             {"$choose":   {"from": [50,50,30,50,75], "weights": [10, 40, 35, 10, 5]}},
        price:              {"$choose":   {"from": [30,20,10,10,5], "weights": [10, 40, 35, 10, 5]}},
        predictionScore:    {"$floating": {"min":0, "max":1, "fixed": 14}},
        predictionDt:       "$date",
        isPurchased:        "$bool",
        purchaseDt:         "$date"
    }
            
    offer = mgenerate(playerOfferTemplate);
    offer.playerId = playerId;
    offer.predictionDt = new Date();
    offer.purchaseDt = offer.isPurchased? new Date() : null;

    switch (offer.offerId) {
        case 1:
            offer.shards = 50;
            offer.price = 30;
            break;
        case 2:
            offer.shards = 50;
            offer.price = 20;
            break;
        case 3:
            offer.shards = 30;
            offer.price = 10;
            break;
        case 4:
            offer.shards = 50;
            offer.price = 10;
            break;
        case 5:
            offer.shards = 75;
            offer.price = 5;
            break;
        default:
            offer.shards = 0;
            offer.price = 0;
    }
    console.log ("Generated this offer: " + JSON.stringify(offer));

    return offer;
}