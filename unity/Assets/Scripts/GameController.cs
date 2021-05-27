using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class GameController : MonoBehaviour {

    public Text PlayerIdText;
    public Text PlayerLevelText;
    public Text PlayerRosterText;

    void OnEnable() {

    }

    void Start() {
        PlayerIdText.text = "PLAYER: " + RealmController.Instance.GetCurrentPlayerProfile().PlayerId + " [" + RealmController.Instance.GetAuthId() + "]";
        PlayerLevelText.text = "LEVEL: " + RealmController.Instance.GetCurrentPlayerProfile().Stats.PlayerLevel;
        PlayerRosterText.text = "ROSTER: \n";
        foreach(var rosterItem in RealmController.Instance.GetCurrentPlayerRoster().Roster) {
            PlayerRosterText.text += rosterItem.CharacterId + " / " + rosterItem.Level + " / " + rosterItem.Shards + " / " + rosterItem.Stars + "\n";
        }
    }

    void Update() {
        
    }
}
