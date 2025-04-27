import { camelCase } from "../_string.js";
import "./_core.js";
import { Child, Iconbutton } from "./_core.js";

export class Textfield extends Child {
    constructor(label = "", type = "", options = {autocomplete: "", disabled: false, max: 0, min: 0, pattern: "", placeholder: "", prefix: "", readOnly: false, required: false, rows: 0, step: 0, suffix: "", supportingText: ""}){
        super();
        this.tag = "md-outlined-text-field";
        this.attributes.label = label;
        this.attributes.name = camelCase(label);
        this.attributes.type = ["date", "email", "number", "password", "tel", "text", "textarea", "search", "url"].includes(type) ? type : "text";
        if(options.placeholder) this.attributes.placeholder = String(options.placeholder);
        if(options.autocomplete) this.attributes.autocomplete = String(autocomplete);
        if(options.disabled) this.attributes.disabled = true;
        if(options.max){
            if(this.attributes.type === "number") this.attributes.max = String(options.max);
            else this.attributes["maxlength"] = Number(options.max);
        }
        if(options.min){
            if(this.attributes.type === "number") this.attributes.min = String(options.min);
            else this.attributes["minlength"] = Number(options.min);
        }
        if(options.pattern) new RegExp(this.attributes.pattern);
        if(options.prefix) this.attributes["prefix-text"] = String(options.prefix);
        if(options.readOnly) this.attributes.readonly = true;
        if(options.required) this.attributes.required = true;
        if(options.rows && this.attributes.type === "textarea") this.attributes.rows = String(options.rows);
        if(options.step && this.attributes.type === "number") String(options.step);
        if(options.suffix) this.attributes["suffix-text"] = String(options.suffix);
        if(options.supportingText) this.attributes["supporting-text"] = String(options.supportingText);
        switch(this.attributes.type){
            case "date":
                this.childList.push(
                    new Iconbutton("calendar_today")
                        .setAttribute({slot:"trailing-icon"})
                        .setListener("click", function(){
                            // open datepicker modal
                        })
                )
                break;
            case "password":
                this.classList.push(
                    new Iconbutton("visibility", "no_visibility")
                        .setAttribute({slot:"trailing-icon"})
                        .setListener("click", function(){
                            if(this.parentElement.type === "password") this.parentElement.type === "text";
                            if(this.parentElement.type === "text") this.parentElement.type === "password";
                        })
                );
                break;
            default:
                break;
        }
    }
    getSelection(){
        return this.getNode({value:""}).value;
    }
}