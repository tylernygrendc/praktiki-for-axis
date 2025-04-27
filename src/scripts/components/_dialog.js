import { Child } from "../_child.js";
import { Icon, Form } from "./_core.js";
export class Dialog extends Child {
    constructor(headline = "", contentArray = [], actionsArray = [], options = {icon: ""}){
        super();
        this.tag = "md-dialog";
        this.childList = [
            new Child().setAttribute({slot: "headline"}).setInnerText(headline),
            new Form(coerce.array(contentArray,[contentArray]).reduce((acc, cv) => {
                if(cv instanceof Child) acc.push(cv);
                else acc.push(new Child().setInnerText(`${cv}`));
                return acc;
            },[])),
            new Child().setAttribute({slot:"actions"}).setChildList(coerce.array(actionsArray,[actionsArray]))
        ];
        if(options.icon) this.childList.unshift(new Icon(options.icon));
    }
    getSelection(){
        
    }
}