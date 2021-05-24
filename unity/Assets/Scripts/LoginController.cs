using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using Realms;
using Realms.Sync;

public class LoginController : MonoBehaviour {

    public string RealmAppId = "e2e-game-offers-app-podsf";
    public InputField UsernameInput;
    public InputField PasswordInput;
    public Button LoginButton;

    private Realm _realm;
    private User _realmUser;
    //private PlayerProfile _playerProfile;

    void Start() {
        UsernameInput.text = "boc@lomtabga.mq";
        PasswordInput.text = "password1234";
        LoginButton.onClick.AddListener(Login);
    }

    async public void Login() {
        if(UsernameInput.text != "" && PasswordInput.text != "") {
            var realmApp = App.Create(new AppConfiguration(RealmAppId) {
                MetadataPersistenceMode = MetadataPersistenceMode.NotEncrypted
            });
            if (_realmUser == null) {
                _realmUser = await realmApp.LogInAsync(Credentials.EmailPassword(UsernameInput.text, PasswordInput.text));
                _realm = await Realm.GetInstanceAsync(new SyncConfiguration(UsernameInput.text, _realmUser));
            } else {
                _realm = Realm.GetInstance(new SyncConfiguration(UsernameInput.text, _realmUser));
            }
            //var _playerProfile = _realm.All<PlayerProfile>().Where(pp => pp.PlayerId == UsernameInput.text);
            var _playerProfile = _realm.All<PlayerProfile>();
            Debug.Log(JsonUtility.ToJson(_playerProfile, true));
            // Debug.Log(_playerProfile.PlayerId);
            // Debug.Log(_playerProfile.AvatarId);
            // Debug.Log(_playerProfile.Benchmark.DeviceModel);
            //Debug.Log(_playerProfile.Where(pp => pp.PlayerId == UsernameInput.text));
            // if(_playerProfile == null) {
            //     _realm.Write(() => {
            //         _playerProfile = _realm.Add(new PlayerProfile(UsernameInput.text));
            //     });
            // }
            // Debug.Log(_playerProfile);
        }
    }


}
