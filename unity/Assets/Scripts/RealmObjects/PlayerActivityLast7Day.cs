using System;
using System.Collections.Generic;
using Realms;
using MongoDB.Bson;

public class PlayerActivityLast7Day : RealmObject {

    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }

    [MapTo("activityDt")]
    public DateTimeOffset? ActivityDt { get; set; }

    [MapTo("amount")]
    public int? Amount { get; set; }

    [MapTo("characterId")]
    public int? CharacterId { get; set; }

    [MapTo("equipmentType")]
    public string EquipmentType { get; set; }

    [MapTo("playerId")]
    public string PlayerId { get; set; }

}