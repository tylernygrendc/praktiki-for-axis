import { Child } from "../_child";

export class Progress extends Child {
    constructor(value = 0, linear = false, options = { buffer: 0, min: 0, max: 100 }){
        super();
        this.tag = linear ? "md-linear-progress" : "md-circular-progress";
        if(value) this.attributes.value = value;
        else this.attributes.indeterminate = true;
        if(options.min) this.attributes.min = options.min;
        if(options.max) this.attributes.max = options.max;
        if(options.buffer && linear) this.attributes.buffer = buffer;
    }
}