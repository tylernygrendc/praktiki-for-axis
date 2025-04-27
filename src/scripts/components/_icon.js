import { Child } from "../_child";

export class Icon extends Child {
    constructor(name=""){
        super();
        this.tag = "md-icon";
        this.innerText = name;
    }
}
export class Iconbutton extends Child {
    constructor(icon = "", selectedIcon = "", options = {disabled: false, toggle: selectedIcon ? true : false}){
        super();
        this.tag = "md-icon-button";
        this.childList = [ new Icon(icon) ];
        if(options.toggle) this.attributes.toggle = true;
        if(options.disabled) this.attributes["soft-disabled"] = true;
        if(selectedIcon) this.childList.push(new Icon(selectedIcon).setAttribute({slot: "selected"}));
    }
    setLink(href = "", openInNewWindow = false){
        Object.assign(this.attributes, { href: href, target: openInNewWindow ? "_blank" : "_self" });
        return this;
    }
}