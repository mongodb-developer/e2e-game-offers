using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using MongoDB.Bson;

public class SpecialOfferButton : MonoBehaviour {

    public ObjectId offerId;
    public int offerNumber;

    private PlayerOffer _playerOffer;
    private Button _button;
    private Text _buttonText;

    void OnEnable() {
        _playerOffer = RealmController.Instance.GetPlayerOffer(offerId);
        GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
        GetComponent<RectTransform>().anchorMax = new Vector2(0, 0);
        GetComponent<RectTransform>().anchoredPosition = new Vector3(1744.0f, 150.0f * (offerNumber + 1), 0.0f);
        transform.localScale = new Vector3(1.0f, 1.0f, 1.0f);
    }

    void Start() {
        _button = GetComponent<Button>();
        _buttonText = GetComponentInChildren<Text>();
        _button.onClick.AddListener(PurchaseOffer);
    }

    void Update() {
        if(_playerOffer != null && _playerOffer.IsValid) {
            _buttonText.text = "Shards: " + _playerOffer.Shards + "\n" + "Price: " + _playerOffer.Price;
        }
    }

    void PurchaseOffer() {
        if(_playerOffer != null && _playerOffer.IsValid) {
            RealmController.Instance.PurchasePlayerOffer(_playerOffer);
            gameObject.SetActive(false);
        }
    }

}
