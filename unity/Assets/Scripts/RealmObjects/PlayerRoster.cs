using System;
using System.Collections.Generic;
using Realms;
using MongoDB.Bson;

[System.Serializable]
public class PlayerRoster : RealmObject {

    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }

    [MapTo("lastUpdateDt")]
    public DateTimeOffset? LastUpdateDt { get; set; }

    [MapTo("playerId")]
    public string PlayerId { get; set; }

    [MapTo("roster")]
    public IList<PlayerRoster_roster> Roster { get; }

}

public class PlayerRoster_roster : EmbeddedObject {

    [MapTo("abilities")]
    public int? Abilities { get; set; }

    [MapTo("characterId")]
    public int? CharacterId { get; set; }

    [MapTo("gearTier")]
    public int? GearTier { get; set; }

    [MapTo("level")]
    public int? Level { get; set; }

    [MapTo("redStars")]
    public int? RedStars { get; set; }

    [MapTo("shards")]
    public int? Shards { get; set; }

    [MapTo("stars")]
    public int? Stars { get; set; }
    
}