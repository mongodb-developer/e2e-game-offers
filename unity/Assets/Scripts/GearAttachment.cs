using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GearAttachment : MonoBehaviour {

    public string equipmentType;

    void Awake() {
        Debug.Log("AWAKE: GearAttachment");
    }

    async void OnMouseDown() {
        Debug.Log("ONMOUSEDOWN: GearAttachment");
        var response = await RealmController.Instance.AttachActivity(equipmentType, 1);
        Debug.Log(response);
    }

}
