export const coerce = {
    array: (array, fallback = []) => {
        if(is.array(array)) return array;
        else return fallback;
    },
    boolean: (boolean, fallback = false) => {
        if(is.boolean(boolean)) return boolean;
        else return fallback;
    },
    function: (f, fallback = function(){}) => {
        if(is.function(f)) return f;
        else return fallback;
    },
    number: (number = 0, fallback = 0) => {
        if(is.number(number)) return number;
        else return fallback;
    },
    object: (object = {}, fallback = {}) => {
        if(is.object(object)) return object;
        else return fallback;
    },
    string: (string = "", fallback = "") => {
        if(is.string(string)) return string;
        else return fallback;
    }
}
export const is = {
    array: (thing) => {
        if(Array.isArray(thing)) return true;
        else return false;
    },
    boolean: (thing) => {
        if(typeof thing === "boolean") return true;
        else return false;
    },
    function: (thing) => {
        if(typeof thing === "function") return true;
        else return false;
    },
    null: (thing) => {
        if(thing === null) return true;
        else return false;
    },
    number: (thing) => {
        if(typeof thing === "number") return true;
        else return false;
    },
    object: (thing) => {
        if(typeof thing === "object" && !Array.isArray(thing) && thing != null) return true;
        else return false;
    },
    string: (thing) => {
        if(typeof thing === "string") return true;
        else return false;
    },
    undefined: (thing) => {
        if(thing === undefined) return true;
        else return false;
    }
}
export const not = {
    array: (thing) => {
        if(Array.isArray(thing)) return false;
        else return true;
    },
    boolean: (thing) => {
        if(typeof thing === "boolean") return false;
        else return true;
    },
    function: (thing) => {
        if(typeof thing === "function") return false;
        else return true;
    },
    null: (thing) => {
        if(thing === null) return false;
        else return true;
    },
    number: (thing) => {
        if(typeof thing === "number") return false;
        else return true;
    },
    object: (thing) => {
        if(typeof thing === "object" && !Array.isArray(thing) && thing != null) return false;
        else return true;
    },
    string: (thing) => {
        if(typeof thing === "string") return false;
        else return true;
    },
    undefined: (thing) => {
        if(thing === undefined) return false;
        else return true;
    }
}

export default function getType(thing) {
    for(const [key, f] of Object.entries(is)) if(f(thing)) return key;
}