import { toMS } from "../_date.mjs";
import { is, coerce } from "../_type.mjs"
export const contentStorage = {
    set: async (obj = {}, location = "local", expires = toMS.h(10)) => {
        if(!(is.object(obj))) throw new Error(`Type of "object" is required.`);
        if(!(["sync","session","local"].includes(location))) throw new Error(`Invalid storage location (${location}). Must be one of "sync","session", or "local".`)
        chrome.runtime.sendMessage({
            type: "storage",
            method: "set",
            location: location,
            expires: new Date().getTime() + expires,
            body: obj
        }, (res) => {
            if(res.ok) return true;
            else throw new Error(res.statusText);
        })
    },
    get: async (query = [], location = "local", sameOrigin = null) => {
        keys = coerce.array(keys);
        chrome.runtime.sendMessage({
            type: "storage",
            method: "get",
            sameOrigin: sameOrigin ? sameOrigin : location === "sync" ? false : true,
            location: location,
            body: {
                query: query
            }
        }, (res) => {
            if(res.ok) return true;
            else throw new Error(res.statusText);
        });
    }
}