using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using MongoDB.Bson;
using System;
using UnityEngine.SceneManagement;

public class GameController : MonoBehaviour {

    public Text playerAbilitiesText;
    public Text playerLevelText;
    public Text playerGearTierText;
    public Text playerCharacterText;
    public Text shardsText;
    public Text playerActivityText;
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
        Debug.Log("START: GameController");
        PlayerRoster_roster pd = RealmController.Instance.GetCurrentRosterPlayerDetails();
        shardsText.text = "x" + pd.Shards;
        playerLevelText.text = "x" + pd.Level;
        playerGearTierText.text = "x" + pd.GearTier;
        playerAbilitiesText.text = "x" + pd.Abilities;
        playerCharacterText.text = "CHARACTER: " + GetCharacterName((int)pd.CharacterId);
        var playerActivity = RealmController.Instance.GetPlayerActivityLast7Day();
        foreach(var activity in playerActivity) {
            playerActivityText.text += activity.EquipmentType + ": " + activity.Amount + "\n";
        }
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
        var playerActivity = RealmController.Instance.GetPlayerActivityLast7Day();
        playerActivityText.text = "LAST 7 DAY ACTIVITY:\n";
        foreach (var activity in playerActivity) {
            playerActivityText.text += "[" + activity.ActivityDt?.ToString("yyyy-MM-dd HH:mm:ss") + "] " + activity.EquipmentType + ": " + activity.Amount + "\n";
        }
        PlayerRoster_roster pd = RealmController.Instance.GetCurrentRosterPlayerDetails();
        shardsText.text = "x" + pd.Shards;
        playerLevelText.text = "x" + pd.Level;
        playerGearTierText.text = "x" + pd.GearTier;
        playerAbilitiesText.text = "x" + pd.Abilities;
    }

    void BackToRoster() {
        SceneManager.LoadScene("RosterScene");
    }

    string GetCharacterName(int characterId) {
        switch(characterId) {
            case 1:
                return "Run and Gun Nic";
            case 2:
                return "Siggo, the Swinging Blade Outcast";
            case 8:
                return "Crazy Joe";
            case 9:
                return "Retro Digital Killer";
            case 10:
                return "CyberWizard Luce of The Land or Noir";
            case 11:
                return "Bizarro Superita";
            default:
                return "Unknown [" + characterId.ToString() + "]";
        }
    }

}
