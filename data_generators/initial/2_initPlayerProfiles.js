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

        await insertPlayersInBulk(client)
            .catch(console.error);

    } finally {
        client.close();
    }
}

// Generate and Insert 1 Player per email
async function insertPlayersInBulk(client) {

    const playerEmailsColl = client.db("game").collection("playerEmails");
    const playerProfileColl = client.db("game").collection("playerProfile");
    const playerProfileBulk = playerProfileColl.initializeOrderedBulkOp();

    // NOTE - THIS DELETES ALL DOCUMENTS IN THE [playerProfiles] COLLECTION
    deleteMany = await playerProfileColl.deleteMany({});

    cursor = await playerEmailsColl.find({});

    while (playerEmail = await cursor.next()) {
        console.log(new Date().toISOString() + " " + playerEmail.email);
        playerProfileBulk.insert(generatePlayer(playerEmail.email));
    }

    await playerProfileBulk.execute();
}

function generatePlayer(playerId) {

    const playerTemplate = {
        "playerId":     playerId,
        "signUpDt":     "$date",
        "lastLoginDt":  "$date",
        "geo":          "$country",
        "locale":       {"$locale":{"region": true}},
        "avatarId":     {"$natural":{"min":1, "max":12}},
        "deviceBenchmark": {
            "accelerometer":                "$bool",
            "sparseTextures":               "$bool",
            "deviceModel":                  {"$choose": {"from":["iPhone X", "iPhone 11", "iPhone 1 Pro", "iPhone 11 Pro Max", "Samsung Galaxy S10", "Samsung Galaxy S11", "Samsung Galaxy S12"]}},
            "supportsVibration":            "$bool",
            "systemMemorySize":             {"$natural":{"min":1, "max":10240}},
            "supportsShadows":              "$bool",
            "supportsLocationService":      "$bool",
            "graphicsMemorySize":           {"$natural":{"min":1, "max":10240}},
            "processorCount":               {"$natural":{"min":1, "max":64}},
            "supports3DTextures":           "$bool"
        },
        "stats": {
            "playerLevel":             {"$natural":{"min":1, "max":80}},
            "charactersUnlocked":      {"$natural":{"min":1, "max":12}},
            "totalCollectionPower":    {"$choose": {"from": [
                                                {"$natural":{"min":1,        "max":3200000}}, 
                                                {"$natural":{"min":3200001,  "max":6400000}}, 
                                                {"$natural":{"min":6400001,  "max":15200000}},
                                                {"$natural":{"min":15200001, "max":24000000}} ], 
                                                "weights": [29, 60, 10, 1]}},
            "mvpWins":                 {"$natural":{"min":0, "max":650}},
            "totalGameTimeDays":       {"$natural":{"min":1, "max":1200}},
            "totalMoneySpent":         {"$choose": {"from": [{"$natural":{"min":1, "max":200}},{"$natural":{"min":201, "max":600}}, {"$natural":{"min":601, "max":4000}}, {"$natural":{"min":4001, "max":10000}}], "weights": [29,60, 10, 1]}}
        },
        "globalGameCounters" : {
            "gold":     {"$natural":{"min":1, "max":10000000}},
            "energy":   {"$natural":{"min":1, "max":10000}}
        }
    }

    return mgenerate(playerTemplate);
}