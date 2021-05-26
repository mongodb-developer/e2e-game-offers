using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Realms;
using MongoDB.Bson;

public class PlayerRoster : RealmObject
{
    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }
    [MapTo("playerId")]
    public string PlayerId { get; set; }
    [MapTo("roster")]
    public IList<PlayerRoster_roster> Roster { get; }
    // [MapTo("ts")]
    // public DateTimeOffset? Ts { get; set; }
}

public class PlayerRoster_roster : EmbeddedObject
{
    [MapTo("abilities")]
    public int? Abilities { get; set; }
    [MapTo("characterId")]
    public int? CharacterId { get; set; }
    [MapTo("gear_tier")]
    public int? GearTier { get; set; }
    [MapTo("level")]
    public int? Level { get; set; }
    [MapTo("redstars")]
    public int? Redstars { get; set; }
    [MapTo("shards")]
    public int? Shards { get; set; }
    [MapTo("stars")]
    public int? Stars { get; set; }
}