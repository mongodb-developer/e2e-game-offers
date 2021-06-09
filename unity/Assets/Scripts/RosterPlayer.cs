using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class RosterPlayer : MonoBehaviour {

    public int characterId;
    public List<Sprite> avatars;

    private SpriteRenderer _spriteRenderer;

    void Start() {
        _spriteRenderer = GetComponent<SpriteRenderer>();
        _spriteRenderer.sprite = avatars[characterId];
    }

    void OnMouseDown() {
        RealmController.Instance.SetCurrentRosterPlayer(characterId);
        SceneManager.LoadScene("PlayerInfoScene");
    }

}