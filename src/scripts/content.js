import "web-components.js";
import { User } from "./library/axis-user";

chrome.runtime.onMessage.addListener((message, sender, response) => {
    switch(message.source.event){
        case "action-icon-click":
            connectPopup();
        case "sync-login":
            try{
                fetch("https://axis.thejoint.com/rest/v11_24/oauth2/token", {
                    "method": "POST",
                    "body": {
                        "username": message.body.username,
                        "password": message.body.password,
                        "client_id": "sugar",
                        "platform": "base",
                        "client_secret": "",
                        "current_language": "en_us",
                        "client_info": { "current_language": "en_us" }
                    }
                }).then(async res => {
                    // ! redirect may be necessary
                    if(res.ok) {
                        res = await res.json();
                        setInterval(() => {
                            // ! assess refresh to avoid storing password
                        }, await res.json().then((json) => {
                            return json.expires_in;
                        }));
                    }
                    response(res);
                });
            } catch (error) {
                console.error(error);
            }
    }
});

window.onload = async () => {
    const user = new User();
    if(user.isLoggedIn()) await connectExtensionUI();
    else if(user.currentApp.isBackOffice && user.settings.connectFrontOffice) user.onLogin = () => {
        chrome.runtime.sendMessage(
            {
                source: {
                    event: "back-office-login",
                    type: "content-script",
                    file: "content.js"
                },
                body: {
                    username: user.getUsername(),
                    password: user.getPassword()
                }
            }, (res) => {
                connectToast(res.ok ? "" : "");
            }
        );
        connectExtensionUI();
    }

}

