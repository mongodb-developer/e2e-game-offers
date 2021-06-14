using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerAvatar : MonoBehaviour {

    public List<Sprite> avatar;

    private SpriteRenderer _spriteRenderer;

    void Awake() {
        Debug.Log("AWAKE: PlayerAvatar");
        _spriteRenderer = GetComponent<SpriteRenderer>();
        _spriteRenderer.sprite = avatar[RealmController.Instance.GetCurrentRosterPlayer()];
    }

}