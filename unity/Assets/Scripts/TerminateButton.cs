using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TerminateButton : MonoBehaviour {

    void Start() { }

    void Update() {
        if(Input.GetKey("escape")) {
            Application.Quit();
        }
    }

    public void OnButtonPressed() {
        Application.Quit();
    }

}
