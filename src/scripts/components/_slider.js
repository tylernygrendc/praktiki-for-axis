import { Child } from "../_child";

export class Slider extends Child {
    constructor(name = "", max = 100, min = 0, value = 50, options = {disabled: false, labeled: false, step: 0, ticks: false}){
        super();
        this.tag = "md-slider";
        this.name = name;
        this.attributes.max = max;
        this.attributes.min = min;
        this.attributes.value = value;
        if(options.disabled) this.attributes.disabled = true;
        if(options.labeled) this.attributes.labeled = true;
        if(options.step) this.attributes.step = Number(step);
        if(options.ticks) this.attributes.ticks = true;
    }
    getSelection(){
        return this.getNode().value;
    }
}

export class Range extends Child {
    constructor(name = "", max = 100, min = 0, start = 25, end = 75, options = {disabled: false, labeled: false, step: 0, ticks: false}){
        super();
        this.tag = "md-slider";
        this.name = name;
        this.attributes.range = true;
        this.attributes.max = max;
        this.attributes.min = min;
        this.attributes["value-start"] = start;
        this.attributes["value-end"] = end;
        if(options.disabled) this.attributes.disabled = true;
        if(options.labeled) this.attributes.labeled = true;
        if(options.step) this.attributes.step = Number(step);
        if(options.ticks) this.attributes.ticks = true;
    }
    getSelection(){
        let node = this.getNode();
        return {
            start: node["value-start"],
            end: node["value-end"]
        }
    }
}