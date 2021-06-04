using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerAvatar : MonoBehaviour {

    public List<Sprite> avatar;

    private SpriteRenderer _spriteRenderer;

    // Start is called before the first frame update
    void Awake() {
        _spriteRenderer = GetComponent<SpriteRenderer>();
        _spriteRenderer.sprite = avatar[RealmController.Instance.GetCurrentRosterPlayer()];
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
