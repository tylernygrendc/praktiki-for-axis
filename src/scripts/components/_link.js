import { Child } from "../_child";

export class Link extends Child {
    constructor(href = "", openInNewWindow = false){
        super();
        this.tag = "a";
        this.attributes.href = href;
        if(openInNewWindow) this.attributes.target = "_blank";
    }
}