using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System.Threading.Tasks;
using Realms;
using Realms.Sync;
using MongoDB.Bson;
using System;

public class RealmController : MonoBehaviour {

    public static RealmController Instance;

    public string RealmAppId = "e2e-game-offers-app-podsf";

    private Realm _realm;
    private App _realmApp;
    private User _realmUser;
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
        return playerProfile;
    }

    public PlayerRoster GetCurrentPlayerRoster() {
        var playerRoster = _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == _email).FirstOrDefault();
        return playerRoster;
    }

    public List<PlayerOffer> GetCurrentPlayerOffers() {
        var playerOffers = _realm.All<PlayerOffer>().Where(po => po.PlayerId == _email && po.IsPurchased == false).ToList();
        return playerOffers;
    }

    public PlayerProfile GetOtherPlayerProfile(string email) {
        return _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == email).FirstOrDefault();
    }

    public PlayerRoster GetOtherPlayerRoster(string email) {
        return _realm.All<PlayerRoster>().Where(pr => pr.PlayerId == email).FirstOrDefault();
    }

    public PlayerOffer GetPlayerOffer(ObjectId offerId) {
        return _realm.Find<PlayerOffer>(offerId);
    }

    public bool PurchasePlayerOffer(PlayerOffer offer) {
        _realm.Write(() => {
            offer.IsPurchased = true;
            offer.PurchaseDt = DateTimeOffset.Now;
        });
        return (bool)offer.IsPurchased;
    }

    public IDisposable ListenForOffers(NotificationCallbackDelegate<PlayerOffer> callback) {
        return _realm.All<PlayerOffer>().Where(po => po.PlayerId == _email && po.IsPurchased == false).SubscribeForNotifications(callback);
    }

}
