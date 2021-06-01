using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using MongoDB.Bson;

public class SpecialOfferButton : MonoBehaviour {

    public ObjectId offerId;
    public int offerNumber;

    private PlayerOffer _playerOffer;
    private Text _buttonText;

    void OnEnable() {
        _playerOffer = RealmController.Instance.GetPlayerOffer(offerId);
        GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
        GetComponent<RectTransform>().anchorMax = new Vector2(0, 0);
        GetComponent<RectTransform>().anchoredPosition = new Vector3(1744.0f, 150.0f * (offerNumber + 1), 0.0f);
        transform.localScale = new Vector3(1.0f, 1.0f, 1.0f);
    }

    void Start() {
        _buttonText = GetComponentInChildren<Text>();
    }

    void Update() {
        _buttonText.text = "Shards: " + _playerOffer.Shards + "\n" + "Price: " + _playerOffer.Price;
    }
}
