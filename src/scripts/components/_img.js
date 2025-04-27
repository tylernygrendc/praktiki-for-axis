import { Child } from "../_child";

export class Img extends Child {
    constructor(src = "", alt = ""){
        super();
        this.tag = "img";
        this.attributes.src = chrome.runtime.getURL(src);
        // ! be sure to declare the resource in the manifest file
        // web_accessible_resources: [src]
        this.attributes.alt = alt;
    }
}