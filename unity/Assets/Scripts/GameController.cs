using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using MongoDB.Bson;
using System;
using UnityEngine.SceneManagement;

public class GameController : MonoBehaviour {

    public Text PlayerIdText;
    public Text PlayerLevelText;
    public Text PlayerRosterText;
    public Text shardsText;
    public Button backButton;

    public GameObject specialOffer;

    private List<PlayerOffer> _specialOffers;
    private IDisposable _offersToken;

    void OnEnable() { }

    void OnDisable() {
        if(_offersToken != null) {
            _offersToken.Dispose();
        }
    }

    void Start() {
        PlayerIdText.text = "PLAYER: " + RealmController.Instance.GetCurrentPlayerProfile().PlayerId + " [" + RealmController.Instance.GetAuthId() + "]";
        PlayerLevelText.text = "LEVEL: " + RealmController.Instance.GetCurrentPlayerProfile().Stats.PlayerLevel;
        PlayerRoster_roster pd = RealmController.Instance.GetCurrentRosterPlayerDetails();
        shardsText.text = "x" + pd.Shards;
        _specialOffers = RealmController.Instance.GetCurrentPlayerOffers();
        for(int i = 0; i < _specialOffers.Count; i++) {
            var tmpOffer = Instantiate(specialOffer);
            tmpOffer.transform.SetParent(GameObject.Find("Canvas").transform);
            tmpOffer.GetComponent<SpecialOfferButton>().offerId = (ObjectId)_specialOffers[i].Id;
            tmpOffer.GetComponent<SpecialOfferButton>().offerNumber = i;
            tmpOffer.SetActive(true);
        }
        _offersToken = RealmController.Instance.ListenForOffers((sender, changes, error) => {
            if(changes != null) {
                for(int i = 0; i < changes.InsertedIndices.Length; i++) {
                    var tmpOffer = Instantiate(specialOffer);
                    tmpOffer.transform.SetParent(GameObject.Find("Canvas").transform);
                    tmpOffer.GetComponent<SpecialOfferButton>().offerId = (ObjectId)RealmController.Instance.GetCurrentPlayerOffers()[changes.InsertedIndices[i]].Id;
                    tmpOffer.GetComponent<SpecialOfferButton>().offerNumber = RealmController.Instance.GetCurrentPlayerOffers().Count - (i + 1);
                    tmpOffer.SetActive(true);
                }
            }
        });
        backButton.onClick.AddListener(BackToRoster);
    }

    void Update() {
        PlayerLevelText.text = "LEVEL: " + RealmController.Instance.GetCurrentPlayerProfile().Stats.PlayerLevel;
    }

    void BackToRoster() {
        SceneManager.LoadScene("RosterScene");
    }

}
