import { getQueue, getRandomId } from "./_utilities.js";
import { coerce } from "./_type.js";

export class Child {
    constructor(tag = ""){
        this.attributes = {};
        this.childList = [];
        this.classList = [];
        this.dataset = {};
        this.id = getRandomId();
        this.innerText = "";
        this.listeners = [];
        this.shadowRoot = {
            isAttached: false,
            // mode: "open",
            // clonable: false,
            // childList: []
        };
        this.styles = {};
        this.computedStyles = {};
        this.tag = tag ? tag : "div";
    }
    #create(){
        let child = document.createElement(this.tag);
            child.id = this.id;
        for(const string of this.classList) child.classList.add(string);
        for(const [key, val] of Object.entries(this.attributes)) child[key] = val;
        for(const [key, val] of Object.entries(this.styles)) child.style[key] = val;
        for(const [key, val] of Object.entries(this.computedStyles)) window.getComputedStyle(child).setProperty(key, val);
        for(const [key, val] of Object.entries(this.dataset)) child.dataset[key] = val;
        if(this.innerText) child.appendChild(document.createTextNode(this.innerText));
        return child;
    }
    appendTo(parent = getQueue()){
        try{
            let child = this.#create();
            if(parent instanceof Child) document.getElementById(parent.id).append(child);
            if(parent instanceof HTMLElement) parent.append(child);
            if(parent instanceof ShadowRoot) parent.append(child)
            if(this.listeners.length) for(const listener of this.listeners) child.addEventListener(listener.type, listener.callback, listener.options);
            if(this.childList.length) for(const descendant of this.childList) if(descendant instanceof Child) descendant.appendTo(child);
            if(this.shadowRoot.isAttached) {
                let shadowRoot = child.attachShadow({mode: this.shadowRoot.mode, clonable: this.shadowRoot.clonable});
                for(const descendant of this.shadowRoot.childList) if(descendant instanceof Child) descendant.appendTo(shadowRoot);
            }
        } catch(error) {
            console.groupCollapsed("Could not append Child.");
            console.error(error);
            console.groupEnd();
        } finally {
            return this;
        }
    }
    exists(){
        return this.getNode(null) === null ? false : true;
    }
    getNode(fallback = null){
        let node = document.getElementById(this.id);
        return node instanceof HTMLElement ? node : fallback;
    }
    setAttribute(object = {}){
        this.attributes = {...this.attributes, ...coerce.object(object)};
        return this;
    }
    setAriaLabel(ariaLabel = ""){
        this.attributes["aria-label"] = ariaLabel;
        return this;
    }
    setChildList(array = []){
        this.childList.push(...coerce.array(array));
        return this;
    }
    setClassList(array = []){
        this.classList.push(...coerce.array(array));
        return this;
    }
    setData(object = {}){
        this.dataset = {...this.dataset, ...coerce.object(object)};
        return this;
    }
    setId(string = ""){
        this.id = string;
        return this;
    }
    setInnerText(string = ""){
        this.innerText = string;
        return this;
    }
    setListener(event = "", callback = function(){}, options = {capture: false, once: false, passive: false, signal: null}){
        let object = {
            capture: typeof options.capture === "boolean" ? options.capture : false,
            once: typeof options.once === "boolean" ? options.once : false,
            passive: typeof options.passive === "boolean" ? options.passive : false
        };
        if(options.signal instanceof AbortSignal) Object.assign(object, options.signal);
        this.listeners.push({type: event, callback: callback, options: object});
        return this;
    }
    setShadowList(childArray = [], mode = "open", clonable = false){
        this.shadowRoot = {
            isAttached: true,
            mode: mode,
            clonable: clonable,
            childList: coerce.array(childArray)
        }
        return this;
    }
    setStyle(object = {}, inline = false){
        if(inline) this.styles = {...this.styles, ...coerce.object(object)};
        else this.computedStyles = {...this.computedStyles, ...coerce.object(object)};
        return this;
    }
}