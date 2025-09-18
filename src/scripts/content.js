import "web-components.js";
import { connectExtensionUI, connectPopup, disconnectExtensionUI, disconnectPopup } from "./library/extension-ui";
import { User } from "./library/axis-user";

chrome.runtime.onMessage.addListener((message) => {
    switch(message.source.event){
        case "action-icon-click":
        default:
            connectPopup();
            break;
    }
});

window.onload = async () => {
    const user = new User();
    if(user.isLoggedIn()){
        const ui = await connectExtensionUI(user);
        user.onLogout(() => {
            disconnectExtensionUI(user);
        });
    }
}

