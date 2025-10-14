import { getRandomId } from "./_utilities.mjs";
import {coerce} from "./_type.mjs";
import { kebabCase } from "./_string.mjs";

export function el(attr) {
    const el = document.createElement(attr.tagName ? attr.tagName : "div");
    if(!(attr.id)) el.id = getRandomId();
    for(const [key, val] of Object.entries(attr)) {
        switch(key){
            case "classList":
                for(const className of coerce.array(val)) el.classList.append(className); 
                break;
            case "dataset":
                for(const [k, v] of Object.entries(coerce.object(val))) el.dataset[k] = v;
                break;
            case "style":
                for(const [k, v] of Object.entries(coerce.object(val))) el.style[kebabCase(k)] = val;
                break;
            default:
                el[key] = val;
                break;
        }
    }
    return el;
}