using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System.Threading.Tasks;
using Realms;
using Realms.Sync;
using MongoDB.Bson;

public class RealmController : MonoBehaviour {

    public static RealmController Instance;

    public string RealmAppId = "e2e-game-offers-app-podsf";

    private Realm _realm;
    private App _realmApp;
    private User _realmUser;
    private PlayerProfile _playerProfile;
    private string _email;

    void Awake() {
        DontDestroyOnLoad(gameObject);
        Instance = this;
    }

    void OnDisable() {
        if(_realm != null) {
            Debug.Log("_realm.Dispose()");
            _realm.Dispose();
        }
    }

    public async Task<string> Login(string email, string password) {
        if(email != "" && password != "") {
            _realmApp = App.Create(new AppConfiguration(RealmAppId) {
                MetadataPersistenceMode = MetadataPersistenceMode.NotEncrypted
            });
            _realmUser = _realmApp.CurrentUser;
            if(_realmUser == null) {
                _realmUser = await _realmApp.LogInAsync(Credentials.EmailPassword(email, password));
                _realm = await Realm.GetInstanceAsync(new SyncConfiguration(email, _realmUser));
            } else {
                _realm = Realm.GetInstance(new SyncConfiguration(email, _realmUser));
            }
            _email = email;
            return _realmUser.Id;
        }
        return "";
    }

    public string GetAuthId() {
        return _realmUser != null ? _realmUser.Id : "";
    }

    public PlayerProfile GetCurrentPlayerProfile() {
        var playerProfile = _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == _email).FirstOrDefault();
        if(playerProfile == null) {
            playerProfile = new PlayerProfile {
                PlayerId = "null@null.com",
                Stats = new PlayerProfile_stats {
                    PlayerLevel = 40
                }
            };
        }
        return playerProfile;
    }

    public PlayerRoster GetCurrentPlayerRoster() {
        var playerRoster = _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == _email).FirstOrDefault();
        // if(playerRoster == null) {
        //     playerRoster = new PlayerRoster {
        //         PlayerId = "null@null.com",
        //         Roster = new List<PlayerRoster_roster>()
        //     };
        //     playerRoster.Roster.Add(new PlayerRoster_roster {
        //         CharacterId = 8,
        //         Level = 1,
        //         GearTier = 1,
        //         Shards = 5,
        //         RedStars = 0,
        //         Stars = 2,
        //         Abilities = 0
        //     });
        //     playerRoster.Roster.Add(new PlayerRoster_roster {
        //         CharacterId = 4,
        //         Level = 6,
        //         GearTier = 2,
        //         Shards = 3,
        //         RedStars = 4,
        //         Stars = 1,
        //         Abilities = 5
        //     });
        // }
        return playerRoster;
    }

    public PlayerProfile GetOtherPlayerProfile(string email) {
        return _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).FirstOrDefault();
    }

    public PlayerRoster GetOtherPlayerRoster(string email) {
        return _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == email).FirstOrDefault();
    }

}
