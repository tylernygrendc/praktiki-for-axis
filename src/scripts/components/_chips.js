import { coerce, is } from "../_type.js";
import { Child } from "../_child.js";
import { Img, Icon} from "./_core.js";

export class Chip extends Child {
    constructor(label = "", callback, options = {avatar: "", disabled: false, elevated: false, icon: ""}){
        super();
        this.innerText = label;
        this.tag = callback ? "md-assist-chip": "md-input-chip";
        if(this.tag === "md-input-chip") this.attributes.removable = true;
        if(callback) this.listeners = [{type: "click", callback: coerce.function(callback)}];
        if(options.avatar && variant === "input") this.childList = [ new Img(options.avatar) ];
        if(options.disabled) { this.attributes.disabled = true; this.attributes["always-focusable"] = true; }
        if(options.elevated) this.attributes.elevated = true;
        if(options.icon) this.childList = [ new Icon(options.icon).setAttribute({slot: "icon"}) ];
    }
    setLink(href = "", openInNewWindow = false){
        this.tag = "md-assist-chip";
        Object.assign(this.attributes, {href: coerce.string(href), target: openInNewWindow ? "_blank" : "_self"});
        this.childList.push(new Icon(openInNewWindow ? "open_in_new" : "link").setAttribute({slot: "icon"}));
        this.listeners = [];
        return this;
    }
}
export class Chipset extends Child {
    constructor(chipsArray = [], callback){
        super();
        this.tag = "md-chip-set";
        this.childList = coerce.array(chipsArray, [chipsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof Chip ? cv : new Chip(`${cv}`).setTagName(is.function(callback) ? "md-suggestion-chip" : "md-filter-chip"));
            return acc;
        },[]);
        if(callback) this.listeners = [{type: "click", callback: coerce.function(callback)}];
    }
    getSelection(){
        return this.getNode().querySelectorAll("md-filter-chip[selected],md-input-chip")
            .reduce((acc, cv) => {
                acc.push(cv.innerText);
                return acc;
            },[]);
    }
}