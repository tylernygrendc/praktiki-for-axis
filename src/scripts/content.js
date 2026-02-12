import { User } from "./library/axis-user.js";
import { el } from "./_element.mjs";

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

user.currentApp.connectCoreUI();