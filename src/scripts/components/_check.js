import { coerce } from "../_type.js";
import { Child } from "../_child.js";
import { Divider } from "./_divider.js";

export class Check extends Child {
    constructor(name = "", value = "", options = {checked: false, disabled: false, indeterminate: false}){
        super();
        this.tag = "md-check";
        this.attributes.name = value ? value : name;
        this.attributes.value = value ? name : "on";
        if(options.checked) this.attributes.checked = true;
        if(options.disabled) this.attributes.disabled = true;
        if(options.indeterminate) this.attributes.indeterminate = true;
    }    
}
export class Checkbox extends Child {
    constructor(label = "", category = "", options = { checked: false, disabled: false, indeterminate: false }){
        super();
        this.tag = "md-checkbox-item";
        this.checkbox = getRandomId();
        this.childList = [
            new Child("label")
                .setAttribute({"for": this.checkbox})
                .setInnerText(label),
            new Check(label, category, options).setId(this.checkbox)
        ];
    }
}
export class CheckList extends Child{
    constructor(category = "", itemsArray = [], useDividers = false){
        super();
        this.tag = "md-check-list";
        this.childList = useDividers ? coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof Checkbox ? cv : new Checkbox(`${cv}`, category));
            acc.push(new Divider());
            return acc;
        },[]) : coerce.array(itemsArray, [itemsArray]).reduce((acc, cv) => {
            acc.push(cv instanceof Checkbox ? cv : new Checkbox(`${cv}`, category));
            return acc;
        },[]);
    }
    getSelection(){
    
    }
}