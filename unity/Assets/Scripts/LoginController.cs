using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class LoginController : MonoBehaviour {

    public InputField UsernameInput;
    public InputField PasswordInput;
    public Button LoginButton;

    void Start() {
        UsernameInput.text = "boc@lomtabga.mq";
        PasswordInput.text = "password1234";
        LoginButton.onClick.AddListener(Login);
    }

    async public void Login() {
        if(await RealmController.Instance.Login(UsernameInput.text, PasswordInput.text) != null) {
            SceneManager.LoadScene("PlayerInfoScene");
        }
    }


}
