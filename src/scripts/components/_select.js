import { camelCase } from "../_string.js";
import { Child } from "../_child.js";

export class Select extends Child {
    constructor(category = "", optionsArray = [], options = {clampMenuWidth: false, disabled: false, required: false, selectedIndex: 0}){
        super();
        this.tag = "md-outlined-select";
        this.attributes.label = category;
        this.attributes.name = camelCase(category);
        if(options.clampMenuWidth) this.attributes["clamp-menu-width"] = true;
        if(options.disabled) this.attributes.disabled = true;
        if(options.required) this.attributes.required = true;
        if(options.selectedIndex) this.attributes["selected-index"] = Number(options.selectedIndex);
        this.childList = optionsArray.reduce((acc, cv) => {
            acc.push(new Child("md-select-option").setChildList([
                new Child().setAttribute({slot:"headline"}).setInnerText(cv)
            ]));
            return acc;
        },[]);
    }
    getSelection(){
        return this.getNode().value;
    }
    setSupportingText(string = ""){
        this.attributes["supporting-text"] = string;
        return this;
    }
}