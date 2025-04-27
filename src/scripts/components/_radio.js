import { coerce } from "../_type.js";
import { Child } from "../_child.js";
import { Divider } from "./_divider.js";

export class Radio extends Child {
    constructor(name = "", value = "", options = { checked: false, disabled: false }){
        super();
        this.tag = "md-switch";
        this.attributes.name = value ? value : name;
        this.attributes.value = value ? name : "on";
        if(options.checked) this.attributes.checked = true;
        if(options.disabled) this.attributes.disabled = true;
    }    
}
export class RadioItem extends Child {
    constructor(label = "", category = "", options = { checked: false, disabled: false }){
        super();
        this.tag = "md-switch-item";
        this.checkbox = getRandomId();
        this.childList = [
            new Child("label")
                .setAttribute({"for": this.checkbox})
                .setInnerText(label),
            new Radio(label, category, options).setId(this.checkbox)
        ];
    }
}
export class RadioList extends Child{
    constructor(category = "", itemsArray = [], useDividers = false){
        super();
        this.tag = "md-switch-list";
        this.childList = useDividers ? coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof RadioItem ? cv : new RadioItem(`${cv}`, category));
            acc.push(new Divider());
            return acc;
        },[]) : coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof RadioItem ? cv : new RadioItem(`${cv}`, category));
            return acc;
        },[]);
    }
    getSelection(){

    }
}