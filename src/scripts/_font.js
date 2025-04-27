import { kebabCase } from "./_string.js";
import { Child } from "./_child.js";

export class Font {
    constructor(name, options = {fallback: "system-ui, sans-serif", format: "", src: ""}){
        this.family = name;
        this.format = options.format ? options.format : "woff2";
        this.src = options.src ? chrome.runtime.getURL(options.src) : chrome.runtime.getURL(`fonts/${kebabCase(name)}.${this.format}`);
        if(options.fallback) this.family += `, ${options.fallback}`;
    }
}

export function fontFace(fontArray) {
    new Child("style").setInnerText(fontArray.reduce((acc, cv) => {
        if(cv instanceof Font) {
            acc += `@font-face{font-family:"${cv.family}";src:url(${this.src});}`;
        } return acc;
    },"").appendTo(document.head));
}