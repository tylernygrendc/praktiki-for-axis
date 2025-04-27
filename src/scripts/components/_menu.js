import { coerce } from "../_type";
import { Child } from "../_child.js";
import { Icon } from "./_core.js";

export class Mi extends Child {
    constructor(headline = "", options = {disabled:false, icon:""}){
        super();
        this.tag = "md-menu-item";
        this.childList = [
            new Child()
                .setAttribute({slot:"headline"})
                .setInnerText(headline)
        ];
        if(options.disabled) this.attributes.disabled = true;
        if(options.icon) this.childList.push(new Icon(options.icon).setAttribute({slot:"end"}))
    }
    setLink(href="",openInNewWindow=false){
        this.attributes.href = href;
        this.attributes.target = openInNewWindow ? "_blank" : "_self";
        this.childList.push(new Icon(openInNewWindow ? "open_in_new" : "link").setAttribute({slot:"end"}));
        return this;
    }
}
export class Submenu extends Child {
    constructor(headline = "", itemsArray = []){
        this.tag = "md-sub-menu";
        this.childList = [
            new Mi(headline, {icon: "keyboard_arrow_right"}),
            new Menu(itemsArray)
        ];
    }
}
export class Menu extends Child {
    constructor(itemsArray=[], anchor = ""){
        super();
        this.tag = "md-menu";
        if(anchor) {
            this.attributes.anchor = anchor;
            if(document.getElementById(anchor) === null) console.warn("Invalid anchor on Menu.")
        }
        this.childList = coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            if(cv instanceof Submenu) this.attributes["has-overflow"] = true;
            acc.push(cv instanceof Child ? cv : new Mi(`${cv}`, {disabled: true}))
            return acc;
        },[]);
    }
    setOffset(x = 0, y = 0){
        if(x) this.attributes["x-offset"] = x;
        if(y) this.attributes["y-offset"] = y;
        return this;
    }
}

