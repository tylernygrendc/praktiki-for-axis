import { Child } from "../_child.js";
import { Iconbutton } from "./_icon.js";

export class Snackbar extends Child {
    constructor(text, action){
        super();
        this.tag = "md-snack-bar";
        this.childList = [
            new Child("span")
                .setInnerText(text)
        ]
        if(action instanceof Child) { 
            this.childList.push(action);
            this.childList.push(new Iconbutton("close")
                .setAriaLabel("hide notification")
                // ! problem here
                .setListener("click", fade, { once: true })
            );
            this.attributes.required = true;
        }
    }
}