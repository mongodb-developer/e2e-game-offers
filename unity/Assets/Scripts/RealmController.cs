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
            _playerProfile = _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).First();
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

    public PlayerProfile GetOtherPlayerProfile(string email) {
        return _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).First();
    }

}
