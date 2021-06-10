using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class RosterController : MonoBehaviour {

    public GameObject rosterPlayer;
    public Text totalMoneySpentText;
    public Text playerIdText;
    public Text playerLevelText;
    public Text energyText;
    public Text goldText;

    private PlayerRoster _playerRoster;
    private PlayerProfile _playerProfile;

    void Awake() {
        _playerProfile = RealmController.Instance.GetCurrentPlayerProfile();
        _playerRoster = RealmController.Instance.GetCurrentPlayerRoster();
        playerIdText.text = "PLAYER: " + RealmController.Instance.GetCurrentPlayerProfile().PlayerId + " [" + RealmController.Instance.GetAuthId() + "]";
        playerLevelText.text = "LEVEL: " + RealmController.Instance.GetCurrentPlayerProfile().Stats.PlayerLevel;
        totalMoneySpentText.text = "SPENT: $" + RealmController.Instance.GetCurrentPlayerProfile().Stats.TotalMoneySpent;
        int colPos = 0, rowPos = 0;
        for(int i = 0; i < _playerRoster.Roster.Count; i++) {
            var tmpRosterItem = Instantiate(rosterPlayer);
            tmpRosterItem.transform.position = new Vector3(-7.0f + (colPos * 3.5f), 1.5f + (rowPos * -4.0f), 0.0f);
            if(colPos == 4) {
                rowPos++;
                colPos = 0;
            } else {
                colPos++;
            }
            tmpRosterItem.GetComponent<RosterPlayer>().characterId = (int)_playerRoster.Roster[i].CharacterId - 1;
            tmpRosterItem.SetActive(true);
        }
    }

}
