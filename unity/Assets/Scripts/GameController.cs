using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Realms;
using Realms.Sync;

public class GameController : MonoBehaviour {

    public Text PlayerIdText;
    public Text PlayerLevelText;

    void OnEnable() {

    }

    void Start() {
        PlayerIdText.text = "PLAYER: " + RealmController.Instance.GetCurrentPlayerProfile().PlayerId + " [" + RealmController.Instance.GetAuthId() + "]";
        PlayerLevelText.text = "LEVEL: " + RealmController.Instance.GetCurrentPlayerProfile().Stats.PlayerLevel;
    }

    void Update() {
        
    }
}
