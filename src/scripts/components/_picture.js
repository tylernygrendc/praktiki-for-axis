import { Child } from "../_child";
import { Img } from "./_img";

export class Picture extends Child {
    constructor(alt = "", small = "", medium = "", large = ""){
        super();
        this.tag = "picture";
        this.childList = [
            new Child("source").setAttribute({
                srcset: small, 
                media: `(max-width: ${breakpoints.small}px)`
            }),
            new Child("source").setAttribute({
                srcset: medium ? medium : small, 
                media: `(min-width: ${breakpoints.medium}px) and (max-width: ${breakpoints.large}px)`
            }),
            new Child("source").setAttribute({
                srcset: large ? large : medium ? medium : small,
                media: `(min-width: ${breakpoints.large}px)`
            }),
            new Img(large, alt)
        ]
    }
}