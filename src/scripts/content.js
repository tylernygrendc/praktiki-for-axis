import { User } from "./library/axis-user.js";
import { Patient } from "./library/axis-patient.js";
import { el } from "./_element.mjs";
import { contentStorage } from "./library/chrome-storage.js";
import { toMS } from "./_date.mjs";

// inject script dependencies
document.body.append(
    document.createComment("praktiki for axis"),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/components.js")
    }),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/pdf.js")
    })
)

const user = new User();

user.getUser().then(user => {
    if(user.settings.useSyncStorage && user.isPrimary) {
        contentStorage.set({currentUser: user}, "sync", Infinity);
    } else if(user.isPrimary) {
        // TODO: prompt user to allow sync storage before saving user data locally
        contentStorage.set({currentUser: user}, "local", Infinity);
    } else {
        // TODO: prompt user to switch chrome before saving user data locally
        contentStorage.set({currentUser: user}, "local", toMS.h(18));
    }
});

user.currentApp.connectCoreUI();