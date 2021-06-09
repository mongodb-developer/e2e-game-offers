using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RosterController : MonoBehaviour {

    public GameObject rosterPlayer;

    private PlayerRoster _playerRoster;

    void Awake() {
        _playerRoster = RealmController.Instance.GetCurrentPlayerRoster();
        int colPos = 0, rowPos = 0;
        for(int i = 0; i < _playerRoster.Roster.Count; i++) {
            var tmpRosterItem = Instantiate(rosterPlayer);
            tmpRosterItem.transform.position = new Vector3(-7.0f + (colPos * 3.5f), 2.0f + (rowPos * -4.0f), 0.0f);
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
