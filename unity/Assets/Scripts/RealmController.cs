using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System.Threading.Tasks;
using Realms;
using Realms.Sync;
using Realms.Sync.Exceptions;
using MongoDB.Bson;
using System;
using UnityEngine.Networking;

public class RealmController : MonoBehaviour {

    public static RealmController Instance;

    public string RealmAppId = "e2e-game-offers-app-podsf";

    private Realm _realm;
    private App _realmApp;
    private User _realmUser;
    private string _email;
    private int _currentRosterPlayer;

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
            //_realmUser = _realmApp.CurrentUser;
            try {
                if(_realmUser == null) {
                    _realmUser = await _realmApp.LogInAsync(Credentials.EmailPassword(email, password));
                    _realm = await Realm.GetInstanceAsync(new SyncConfiguration(email, _realmUser));
                    await _realm.GetSession().WaitForDownloadAsync();
                } else {
                    _realm = Realm.GetInstance(new SyncConfiguration(email, _realmUser));
                }
            } catch (ClientResetException clientResetEx) {
                if(_realm != null) {
                    _realm.Dispose();
                }
                clientResetEx.InitiateClientReset();
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
        int? characterId = _currentRosterPlayer + 1;
        var playerOffers = _realm.All<PlayerOffer>().Where(po => po.PlayerId == _email && po.IsPurchased == false && po.CharacterId == characterId).ToList();
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
        int? characterId = _currentRosterPlayer + 1;
        return _realm.All<PlayerOffer>().Where(po => po.PlayerId == _email && po.IsPurchased == false && po.CharacterId == characterId).SubscribeForNotifications(callback);
    }

    public void SetCurrentRosterPlayer(int character) {
        _currentRosterPlayer = character;
    }

    public int GetCurrentRosterPlayer() {
        return _currentRosterPlayer;
    }

    public PlayerRoster_roster GetCurrentRosterPlayerDetails() {
        var roster = GetCurrentPlayerRoster();
        int? characterId = _currentRosterPlayer + 1;
        return roster.Roster.Where(p => p.CharacterId == characterId).FirstOrDefault();
    }

    public List<PlayerActivityLast7Day> GetPlayerActivityLast7Day() {
        int? characterId = _currentRosterPlayer + 1;
        return _realm.All<PlayerActivityLast7Day>().Where(pa => pa.PlayerId == _email && pa.CharacterId == characterId).ToList();
    }

    public async Task<BsonValue> AttachActivity(string equipmentType, int amount) {
        var document = new BsonDocument {
            { "playerId", _email },
            { "characterId", (_currentRosterPlayer + 1) },
            { "equipmentType", equipmentType },
            { "amount", amount }
        };
        return await _realmUser.Functions.CallAsync("funcAddActivity", document);
    }

}