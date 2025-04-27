import { Child } from "../_child.js";
import { Divider, Icon, Img } from "./_core.js";

export class Li extends Child {
    constructor(headline="", supportingText="", options = {slot: {start:"", end:""}}){
        super();
        this.tag = "md-list-item";
        if(supportingText) this.childList = [ 
            new Child().setAttribute({slot:"headline"}).setInnerText(headline), 
            new Child().setAttribute({slot:"supporting-text"}).setInnerText(supportingText) 
        ]; else this.innerText = headline;
        if(options.slot.start) {
            if(options.slot.start instanceof Icon) this.childList.push(options.slot.start.setAttribute({slot:"start"}));
            if(options.slot.start instanceof Img) this.childList.push(options.slot.start.setAttribute({slot:"start",style:"width:56px;"}));
        }
        if(options.slot.end){
            if(options.slot.start instanceof Icon) this.childList.push(options.slot.end.setAttribute({slot:"start"}));
            if(options.slot.start instanceof Img) this.childList.push(options.slot.end.setAttribute({slot:"end",style:"width:56px;"}));
        }
    }
    setLink(href = "", openInNewWindow = false){
        Object.assign(this.attributes, {href: coerce.string(href), target: openInNewWindow ? "_blank" : "_self"});
        this.listeners = [];
        return this;
    }
}
 export class List extends Child {
    constructor(itemsArray = [], useDividers = false){
        super();
        this.tag = "md-list";
        this.childList = useDividers ? coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof Li ? cv : new Li(`${cv}`));
            acc.push(new Divider());
            return acc;
        },[]) : coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof Li ? cv : new Li(`${cv}`));
        },[]);
    }
}