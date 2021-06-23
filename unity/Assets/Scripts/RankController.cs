using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RankController : MonoBehaviour {

    public GameObject starSprite;

    private List<GameObject> _stars;

    void Awake() {
        _stars = new List<GameObject>();
        for(int i = 0; i < 6; i++) {
            var tmpStar = Instantiate(starSprite);
            tmpStar.transform.position = new Vector3(-8.3f + (i * 0.65f), -0.45f, 0.0f);
            _stars.Add(tmpStar);
        }
    }

    void Update() {
        PlayerRoster_roster pd = RealmController.Instance.GetCurrentRosterPlayerDetails();
        for(int i = 0; i < 6; i++) {
            _stars[i].GetComponent<SpriteRenderer>().color = Color.gray;
        }
        for(int i = 0; i < pd.Stars - 1; i++) {
            _stars[i].GetComponent<SpriteRenderer>().color = Color.white;
        }
        for(int i = 0; i < pd.RedStars - 1; i++) {
            _stars[i].GetComponent<SpriteRenderer>().color = Color.red;
        }
    }
}
