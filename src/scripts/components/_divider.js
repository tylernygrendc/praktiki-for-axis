import { Child } from "../_child";

export class Divider extends Child {
    constructor(inset = false){
        super();
        this.tag = "md-divider";
        if(inset) this.attributes.inset = true;
    }
}