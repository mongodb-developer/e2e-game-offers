//Initialize Players and Roster
const mgenerate = require("mgeneratejs");
const MongoClient = require('mongodb').MongoClient;

main().catch(console.error);

async function main() {

    const uri = "mongodb+srv://main_game_user:main_game_user**@game-main.maftg.mongodb.net/game";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    await client.connect();

    const totalPlayers = 100000
    const batch = 1000;

    var playerId;
    for (playerId = 1; playerId < totalPlayers; playerId+= batch) {
        
        console.log(new Date().toISOString() + " " + playerId + " " + (playerId+batch-1));
        
        await insertPlayersInBulk(playerId, (playerId+batch-1), client)
                .catch(console.error);
        
        await insertRosterInBulk(playerId, (playerId+batch-1), client)
                .catch(console.error);
    }

    client.close();
}
  
async function insertPlayersInBulk(startPlayerId, endPlayerId, client) {

    const playerProfileColl = client.db("game").collection("playerProfile");
    const playerBulk = playerProfileColl.initializeUnorderedBulkOp();

    const playerTemplate = {
        "playerId":     "$number",
        "signUp_ts":    "$date",
        "lastLogin_ts": "$date",
        "geo":          "$country",
        "locale":       {"locale":{"region": true}},
        "avatar_id":    {"$choose": {"from":["Leafy1","Leafy2","Leafy3","Leafy4","Leafy5","Leafy6","Leafy7","Leafy8","Leafy9","Leafy10","Leafy11","Leafy12"]}},
        "device_benchmark": {
            "accelerometer":                "$bool",
            "sparse_textures":              "$bool",
            "device_model":                 {"$choose": {"from":["iPhone X", "iPhone 11", "iPhone 1 Pro", "iPhone 11 Pro Max", "Samsung Galaxy S10", "Samsung Galaxy S11", "Samsung Galaxy S12"]}},
            "supports_vibration":           "$bool",
            "system_memory_size":           "$integer",
            "supports_shadows":             "$bool",
            "supports_location_service":    "$bool",
            "graphics_memory_size":         "$integer",
            "processor_count":              "$integer",
            "supports_3d_textures":         "$bool"
        },
        "stats": {
            "player_level":             {"$integer":{"min":1, "max":80}},
            "characters_unlocked":      {"$integer":{"min":1, "max":12}},
            "total_collection_power":   {"$choose": {"from": [{"$integer":{"min":1, "max":3200000}}, {"$integer":{"min":3200001, "max":6400000}}, {"$integer":{"min":6400001, "max":15200000}},{"$integer":{"min":15200001, "max":24000000}} ], "weights": [29,60, 10, 1]}},
            "mvp_wins":                 {"$integer":{"min":0, "max":650}},
            "total_game_time_days":     {"$integer":{"min":1, "max":1200}},
            "total_money_spent":        {"$choose": {"from": [{"$integer":{"min":1, "max":200}},{"$integer":{"min":201, "max":600}}, {"$integer":{"min":601, "max":4000}}, {"$integer":{"min":4001, "max":10000}}], "weights": [29,60, 10, 1]}}
        },
        "global_game_counters" : {
            "gold":     {"$integer":{"min":1}},
            "energy":   {"$integer":{"min":1}}
        }
    }
//TODO: Pass after mgenerate to normalize the values to the right profile stats

    var playerId;
    for (playerId = startPlayerId; playerId <= endPlayerId; playerId++) {
        let player = mgenerate(playerTemplate);
        player.playerId = playerId;
        playerBulk.insert(player);
    }

    await playerBulk.execute();
}

async function insertRosterInBulk(startPlayerId, endPlayerId, client) {

    const playerRosterColl = client.db("game").collection("playerRoster");
    const rosterBulk = playerRosterColl.initializeUnorderedBulkOp();

    const playerRosterTemplate = {
        "playerId": "$number",
        "roster": {"$array": { "of": {
            "characterId":  {"$integer":{"min":1, "max":12}},
            "level":        {"$integer":{"min":0, "max":12}},
            "gear_tier":    {"$integer":{"min":0, "max":15}},
            "shards":       {"$integer":{"min":0, "max":810}},
            "stars":        {"$integer":{"min":0, "max":7}},
            "redstars":     {"$integer":{"min":0, "max":7}},
            "abilities":    {"$integer":{"min":0, "max":26}}
        }, "number": { "$number": { "min": 1, "max": 12}}}}
    }

    var playerId;
    for (playerId = startPlayerId; playerId <= endPlayerId; playerId++) {
        let playerRoster = mgenerate(playerRosterTemplate);
        playerRoster.playerId = playerId;

        var characterId
        for(characterId = 0; characterId < playerRoster.roster.length; characterId++)
            playerRoster.roster[characterId].characterId = characterId+1;
        rosterBulk.insert(playerRoster);
    }

    await rosterBulk.execute();
}