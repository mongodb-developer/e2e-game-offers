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
    private PlayerRoster _playerRoster;

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

    public async Task<PlayerProfile> Login(string email, string password) {
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
            Debug.Log(email + ": " + _realmUser.Id);
            _playerProfile = _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).FirstOrDefault();
            _playerRoster = _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == email).FirstOrDefault();
            Debug.Log(_playerProfile);
            Debug.Log(_playerRoster);
            return _playerProfile;
        }
        return _playerProfile;
    }

    public string GetAuthId() {
        return _realmUser != null ? _realmUser.Id : "";
    }

    public PlayerProfile GetCurrentPlayerProfile() {
        return _playerProfile;
    }

    public PlayerRoster GetCurrentPlayerRoster() {
        return _playerRoster;
    }

    public PlayerProfile GetOtherPlayerProfile(string email) {
        return _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).First();
    }

    public PlayerRoster GetOtherPlayerRoster(string email) {
        return _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == email).First();
    }

}
