using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Realms;
using Realms.Sync;

public class GameController : MonoBehaviour {

    public Text PlayerIdText;

    void OnEnable() {

    }

    void Start() {
        PlayerIdText.text = "PLAYER: " + RealmController.Instance.GetCurrentPlayerProfile().PlayerId;
    }

    void Update() {
        
    }
}
