using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

public class GearAttachment : MonoBehaviour {

    public string equipmentType;

    void Awake() {
        Debug.Log("AWAKE: GearAttachment");
    }

    async void OnMouseDown() {
        Debug.Log("ONMOUSEDOWN: GearAttachment");
        string[] equipmentTypes = { "shards", "gear", "level", "abilities" };
        if(Array.IndexOf(equipmentTypes, equipmentType) >= 0) {
            var response = await RealmController.Instance.AttachActivity(equipmentType, 1);
            Debug.Log(response);
        } else {
            Debug.Log("Invalid Equipment Type");
        }
    }

}
