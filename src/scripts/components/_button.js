import { Child } from "../_child.js";
import { Icon } from "./_core.js";

export class Button extends Child {
    constructor(label="", options = {icon: "", disabled: false, trailingIcon: false, variant: ""}){
        super();
        this.tag = ["filled","filled-tonal","outlined"].includes(options.variant) ? `md-${options.variant}-button` : "md-text-button";
        this.innerText = label;
        if(options.icon) this.children = [ new Icon(options.icon).setAttribute({slot: "icon"}) ];
        if(options.disabled) this.attributes["soft-disabled"] = true;
        if(options.trailingIcon) this.attributes["trailing-icon"] = true;
    }
    setLink(href = "", openInNewWindow = false){
        Object.assign(this.attributes, { href: href, target: openInNewWindow ? "_blank" : "_self", "trailing-icon": true});
        this.childList = [ new Icon(openInNewWindow ? "open_in_new" : "link").setAttribute({slot: "icon"}) ];
        return this;
    }
}
