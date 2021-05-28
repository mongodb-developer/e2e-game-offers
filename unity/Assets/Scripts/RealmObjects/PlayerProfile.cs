using System;
using System.Collections.Generic;
using Realms;
using MongoDB.Bson;

[System.Serializable]
public class PlayerProfile : RealmObject {

    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }

    [MapTo("avatarId")]
    public int? AvatarId { get; set; }

    [MapTo("deviceBenchmark")]
    public PlayerProfile_deviceBenchmark DeviceBenchmark { get; set; }

    [MapTo("geo")]
    public string Geo { get; set; }

    [MapTo("globalGameCounters")]
    public PlayerProfile_globalGameCounters GlobalGameCounters { get; set; }

    [MapTo("lastLoginDt")]
    public DateTimeOffset? LastLoginDt { get; set; }

    [MapTo("locale")]
    public string Locale { get; set; }

    [MapTo("playerId")]
    public string PlayerId { get; set; }

    [MapTo("signUpDt")]
    public DateTimeOffset? SignUpDt { get; set; }

    [MapTo("stats")]
    public PlayerProfile_stats Stats { get; set; }

}


public class PlayerProfile_deviceBenchmark : EmbeddedObject {

    [MapTo("accelerometer")]
    public bool? Accelerometer { get; set; }

    [MapTo("deviceModel")]
    public string DeviceModel { get; set; }

    [MapTo("graphicsMemorySize")]
    public int? GraphicsMemorySize { get; set; }

    [MapTo("processorCount")]
    public int? ProcessorCount { get; set; }

    [MapTo("sparseTextures")]
    public bool? SparseTextures { get; set; }

    [MapTo("supports3DTextures")]
    public bool? Supports3DTextures { get; set; }

    [MapTo("supportsLocationService")]
    public bool? SupportsLocationService { get; set; }

    [MapTo("supportsShadows")]
    public bool? SupportsShadows { get; set; }

    [MapTo("supportsVibration")]
    public bool? SupportsVibration { get; set; }

    [MapTo("systemMemorySize")]
    public int? SystemMemorySize { get; set; }

}

public class PlayerProfile_globalGameCounters : EmbeddedObject {

    [MapTo("energy")]
    public int? Energy { get; set; }

    [MapTo("gold")]
    public int? Gold { get; set; }

}

public class PlayerProfile_stats : EmbeddedObject {

    [MapTo("charactersUnlocked")]
    public int? CharactersUnlocked { get; set; }

    [MapTo("mvpWins")]
    public int? MvpWins { get; set; }

    [MapTo("playerLevel")]
    public int? PlayerLevel { get; set; }

    [MapTo("totalCollectionPower")]
    public int? TotalCollectionPower { get; set; }

    [MapTo("totalGameTimeDays")]
    public int? TotalGameTimeDays { get; set; }

    [MapTo("totalMoneySpent")]
    public double? TotalMoneySpent { get; set; }

}