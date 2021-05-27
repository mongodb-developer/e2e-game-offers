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

        await insertRosterInBulk(client)
            .catch(console.error);

    } finally {
        client.close();
    }
}

// Generate and Insert 1 roster per Player
async function insertRosterInBulk(client) {

    const playerProfileColl = client.db("game").collection("playerProfile");
    const playerRosterColl = client.db("game").collection("playerRoster");
    const playerRosterBulk = playerRosterColl.initializeOrderedBulkOp();

    // NOTE - THIS DELETES ALL DOCUMENTS IN THE [playerRoster] COLLECTION
    deleteMany = await playerRosterColl.deleteMany({});

    cursor = await playerProfileColl.find({});

    while (playerProfile = await cursor.next()) {
        console.log(new Date().toISOString() + " " + playerProfile.playerId);
        playerRosterBulk.insert(generateRoster(playerProfile.playerId));
    }

    await playerRosterBulk.execute();
}

function generateRoster(playerId) {

    const playerRosterTemplate = {
        "playerId": "$email",
        "roster": {"$array": { "of": {
            "characterId":  {"$natural":{"min":1, "max":12}},
            "level":        {"$natural":{"min":0, "max":12}},
            "gearTier":     {"$natural":{"min":0, "max":15}},
            "shards":       {"$natural":{"min":0, "max":810}},
            "stars":        {"$natural":{"min":0, "max":7}},
            "redStars":     {"$natural":{"min":0, "max":7}},
            "abilities":    {"$natural":{"min":0, "max":26}}
        }, "number": { "$number": { "min": 1, "max": 12}}}},
        "lastUpdateDt":     "$date"
    }
            
    playerRoster = mgenerate(playerRosterTemplate);
    
    playerRoster.playerId = playerId;
    playerRoster.lastUpdateDt = new Date();

    console.log("Roster length: " + playerRoster.roster.length);

    var cId
    for(cId = 0; cId < playerRoster.roster.length; cId++)
        playerRoster.roster[cId].characterId = NumberInt(cId+1);

    console.log ("Generated this roster: " + JSON.stringify(playerRoster));

    return playerRoster;
}