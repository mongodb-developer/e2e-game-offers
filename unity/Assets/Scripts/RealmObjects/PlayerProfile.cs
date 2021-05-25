using System;
using System.Collections.Generic;
using Realms;
using MongoDB.Bson;

[System.Serializable]
public class PlayerProfile : RealmObject {

    [PrimaryKey]
    [MapTo("_id")]
    public ObjectId? Id { get; set; }

    [MapTo("avatar_id")]
    public string AvatarId { get; set; }

    [MapTo("device_benchmark")]
    public PlayerProfile_device_benchmark DeviceBenchmark { get; set; }

    [MapTo("geo")]
    public string Geo { get; set; }

    [MapTo("global_game_counters")]
    public PlayerProfile_global_game_counters GlobalGameCounters { get; set; }

    [MapTo("lastLogin_ts")]
    public DateTimeOffset? LastLoginTs { get; set; }

    [MapTo("locale")]
    public PlayerProfile_locale Locale { get; set; }

    [MapTo("playerId")]
    public string PlayerId { get; set; }

    [MapTo("signUp_ts")]
    public DateTimeOffset? SignUpTs { get; set; }

    [MapTo("stats")]
    public PlayerProfile_stats Stats { get; set; }

}

public class PlayerProfile_device_benchmark : EmbeddedObject {

    [MapTo("accelerometer")]
    public bool? Accelerometer { get; set; }

    [MapTo("device_model")]
    public string DeviceModel { get; set; }

    [MapTo("graphics_memory_size")]
    public double? GraphicsMemorySize { get; set; }

    [MapTo("processor_count")]
    public double? ProcessorCount { get; set; }

    [MapTo("sparse_textures")]
    public bool? SparseTextures { get; set; }

    [MapTo("supports_3d_textures")]
    public bool? Supports3dTextures { get; set; }

    [MapTo("supports_location_service")]
    public bool? SupportsLocationService { get; set; }

    [MapTo("supports_shadows")]
    public bool? SupportsShadows { get; set; }

    [MapTo("supports_vibration")]
    public bool? SupportsVibration { get; set; }

    [MapTo("system_memory_size")]
    public double? SystemMemorySize { get; set; }

}

public class PlayerProfile_global_game_counters : EmbeddedObject {

    [MapTo("energy")]
    public double? Energy { get; set; }

    [MapTo("gold")]
    public double? Gold { get; set; }

}

public class PlayerProfile_locale : EmbeddedObject {

    [MapTo("locale")]
    public PlayerProfile_locale_locale Locale { get; set; }

}

public class PlayerProfile_locale_locale : EmbeddedObject {

    [MapTo("region")]
    public bool? Region { get; set; }

}

public class PlayerProfile_stats : EmbeddedObject {

    [MapTo("characters_unlocked")]
    public int? CharactersUnlocked { get; set; }

    [MapTo("mvp_wins")]
    public int? MvpWins { get; set; }

    [MapTo("player_level")]
    public int? PlayerLevel { get; set; }

    [MapTo("total_collection_power")]
    public int? TotalCollectionPower { get; set; }

    [MapTo("total_game_time_days")]
    public int? TotalGameTimeDays { get; set; }

    [MapTo("total_money_spent")]
    public int? TotalMoneySpent { get; set; }
    
}