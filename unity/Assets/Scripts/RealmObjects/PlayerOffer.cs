using System;
using System.Collections.Generic;
using Realms;
using MongoDB.Bson;

[System.Serializable]
public class PlayerOffer : RealmObject {

    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }

    [MapTo("characterId")]
    public int? CharacterId { get; set; }

    [MapTo("isPurchased")]
    public bool? IsPurchased { get; set; }
    
    [MapTo("offerId")]
    public int? OfferId { get; set; }

    [MapTo("playerId")]
    public string PlayerId { get; set; }

    [MapTo("predictionDt")]
    public DateTimeOffset? PredictionDt { get; set; }

    [MapTo("predictionScore")]
    public double? PredictionScore { get; set; }

    [MapTo("price")]
    public double? Price { get; set; }

    [MapTo("purchaseDt")]
    public DateTimeOffset? PurchaseDt { get; set; }

    [MapTo("shards")]
    public int? Shards { get; set; }

}