function kebabCase(string){
    return string.split(/[A-Z]|_|\s/g).reduce((acc, cv, i, initialArray) => {
        return i < initialArray.length - 1 ? acc += `${cv.toLowerCase()}-`: acc += cv.toLowerCase();
    }, "");
}

const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
function getRandomId(){
    let randomString = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    for(var i = 0; i < 4; ++i) randomString = alphabet[Math.floor(Math.random() * 26)] + randomString;
    return randomString;
}

const coerce = {
    array: (array, fallback = []) => {
        if(is.array(array)) return array;
        else return fallback;
    },
    boolean: (boolean, fallback = false) => {
        if(is.boolean(boolean)) return boolean;
        else return fallback;
    },
    element: (element, fallback = Element) => {
        if(is.element(element)) return element;
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
};
const is = {
    array: (thing) => {
        if(Array.isArray(thing)) return true;
        else return false;
    },
    boolean: (thing) => {
        if(typeof thing === "boolean") return true;
        else return false;
    },
    element: (thing) => {
        if(thing instanceof Element) return true;
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
};

class Listener {
    constructor(event = "", listener = ()=>{} , options = {capture: false, once: false}){
        this.e = event;
        this.f = listener;
        this.o = options;
    }
}

function el(attr = {}) {
    const el = document.createElement(attr.tagName ? attr.tagName : "div");
    if(!(attr.id)) el.id = getRandomId();
    for(const [key, val] of Object.entries(attr)) {
        switch(key){
            case "aria":
                for(const [k, v] of Object.entries(coerce.object(val))) el.setAttribute(`aria-${k}`, v);
                break;
            case "attributes":
                for(const [k, v] of Object.entries(coerce.object(val))) el.setAttribute(k, v);
                break;
            case "children":
                for(const child of coerce.array(val)) if(child instanceof Element) el.append(child);
                break;
            case "classList":
                for(const className of coerce.array(val)) el.classList.add(className); 
                break;
            case "dataset":
                for(const [k, v] of Object.entries(coerce.object(val))) el.dataset[k] = v;
                break;
            case "listeners":
                for(const listener of coerce.array(val)){
                    if(listener instanceof Listener) el.addEventListener(listener.e, listener.f, listener.o);
                }
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

new Date(new Date().setHours(23,59,59));
new Date(new Date().setHours(0,0,0));
new Date(new Date().getFullYear(),11,31,23,59,59);
new Date(new Date().getFullYear(),0,1);
const toMS = {
    h: (hrs) => {
        return hrs * 60 * 60000;
    },
    m: (min) => {
        return hrs * 60000;
    },
    s: (sec) => {
        return sec * 1000;
    },
    t: (hrs = 0, min = 0, sec = 0) => {
        return (hrs * 60 * 60000) + (hrs * 60000) + (sec * 1000);
    }
};

const contentStorage = {
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
        });
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
};

class App {
    constructor(){
        this.log = [];
        this.name = null;
        this.resource = null;
        this.isBackOffice = false;
        this.isFrontOffice = false;
        switch(window.location.hostname){
            case "axis.thejoint.com": 
                this.name = "axis-front-office";
                this.resource = kebabCase(window.location.hash.split("/")[0].slice(1));
                this.isFrontOffice = true;
                break;
            case "backoffice.thejoint.com":
                this.name = "axis-back-office";
                this.resource = window.location.pathname.split("/")[1];
                this.isBackOffice = true;
                break;
        }
    }
    connectAlert(){

    }
    connectDialog(){

    }
    connectPopup(){

    }
    async connectCoreUI(){
        switch(this.resource){
            case "login":
                document.querySelector(this.isBackOffice ? "button[type=submit]" : "a[name=login_button]").addEventListener("click", async (e) => {
                    e.preventDefault();
                    // collect login details
                    const username = document.querySelector(this.isBackOffice ? "input#user_name" : "input[name=username]").value;
                    const password = document.querySelector(this.isBackOffice ? "input#password" : "input[name=password]").value;
                    // get tokens from front office
                    let res = await frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/oauth2/token?platform=base`, {
                        method: "POST",
                        headers: {
                            "accept": "application/json, text/javascript, */*; q=0.01",
                            "cache-control": "no-cache",
                            "content-type": "application/json",
                            "pragma": "no-cache",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin",
                            "x-requested-with": "XMLHttpRequest"
                        },
                        body: {
                            "client_id": "sugar",
                            "client_secret": "",
                            "grant_type": "password",
                            "username": username,
                            "password": password,
                            "platform": "base"
                        }
                    });
                    // store tokens
                    if(res.ok) {
                        res = await res.json();
                        await contentStorage.set({
                            oauthToken: res.access_token
                        }, "sync", toMS.s(res.expires_in));
                        await contentStorage.set({
                            refreshToken: res.refresh_token
                        }, "sync", toMS.s(res.refresh_expires_in));
                        await contentStorage.set({
                            downloadToken: res.download_token
                        }, "sync");
                    }
                    if(this.isBackOffice){
                        // resume normal login
                        res = await fetch("https://backoffice.thejoint.com/login", {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: `_token=${document.querySelector("meta[name=csrf-token]").content}&user_name=${username}&password=${password}&doctor_status=${document.querySelector("select#doctor_status").value.replaceAll(/\s/gi,"+")}`
                        });
                        // redirect if login successful
                        if(res.ok) window.location.href = "https://backoffice.thejoint.com/pending-notes";
                        else throw new Error(res.statusText);
                    } else if (this.isFrontOffice){
                        // store tokens locally
                        localStorage.setItem("prod:SugarCRM:AuthAccessToken", res.access_token);
                        localStorage.setItem("prod:SugarCRM:AuthRefreshToken", res.refresh_token);
                        localStorage.setItem("prod:SugarCRM:DownloadToken", res.download_token);
                        // redirect to home
                        window.location.href = "https://axis.thejoint.com/#Home";
                    }
                });
                break;
            case "cert-create":
                if(document.querySelector("#CompletedVisitData")) ; else {
                    // * pending visit
                    // modify save/complete buttons
                    document.querySelector(".saveCompleted").prepend(el({
                        tagName: "a",
                        classList: ["axis-extension-button"],
                        innerText: "Exit",
                        attributes: {
                            href: `https://backoffice.thejoint.com`
                        }
                    }));
                    // inject core ui
                    document.body.append(el({
                        tagName: "div",
                        id: "praktiki-core-ui",
                        classList: [],
                        innerHTML: (async () => {
                            let res = await fetch(chrome.runtime.getURL("markup/visit.html"));
                            if(res.ok) return await res.text();
                            else throw new Error(res.statusText);
                        })()
                    }));
                }
                this.enableTabs();
                break;
            case "waiting-queue":
            case "pending-notes":
            case "completed-visits":
            case "patient-search":
            case "task-management":
                let ui = await (async () => {
                    let res = await fetch(chrome.runtime.getURL("markup/contact.html"));
                    if(res.ok) return await res.text();
                    else throw new Error(res.statusText);
                })();
                document.querySelector("#app .col-md-2").append(el({
                    tagName: "div",
                    id: "praktiki-core-ui",
                    classList: [],
                    innerHTML: ui
                }));
                this.enableTabs();
                this.enableDragContact();
                break;
            case "home":
                if(!(document.querySelector("form[name=login]"))){
                    document.querySelector("#content div").append(el({
                        tagName: "div",
                        id: "praktiki-core-ui",
                        classList: [],
                        innerHTML: (async () => {
                            let res = await fetch(chrome.runtime.getURL("markup/contact.html"));
                            if(res.ok) return await res.text();
                            else throw new Error(res.statusText);
                        })()
                    }));
                    this.enableTabs();
                    this.enableDragContact();
                    break;
                }
            case "contacts":
                if(!(document.querySelector("form[name=login]"))){
                    document.querySelector("#content div").append(el({
                        tagName: "div",
                        id: "praktiki-core-ui",
                        classList: [],
                        innerHTML: (async () => {
                            let res = await fetch(chrome.runtime.getURL("markup/contact.html"));
                            if(res.ok) return await res.text();
                            else throw new Error(res.statusText);
                        })()
                    }));
                    this.enableTabs();
                    this.enableHideDocument();
                    break;
                }
        }
    }
    enableDragContact(){
        // custom drag image
        const image = el({
            tagName: "img",
            src: chrome.runtime.getURL("icons/app/48.png")});
        // make contact (tr) draggable
        document.querySelectorAll("table").forEach(table => {
            const dragBehavior = (e = DragEvent) => {
                e.dataTransfer.clearData();
                e.dataTransfer.setData("text", JSON.stringify({
                    patient_id: e.target.children[0].dataset["patient_id"],
                    visit_id: e.target.children[0].dataset["visit_id"],
                    name: e.target.children[0].children[0].innerText,
                    dob: e.target.children[2].innerText
                }));
                e.dataTransfer.setDragImage(image, 24, 24);
            };
            const enableDragFor = (node) => {
                node.setAttribute("draggable", "true");
                node.removeEventListener("dragstart", dragBehavior);
                node.addEventListener("dragstart", dragBehavior);
            };
            // enable drag initially
            table.querySelectorAll('tbody tr').forEach(row => {
                enableDragFor(row);
            });
            // enable drag anytime table rows are added
            new MutationObserver((mutationList) => {
                for(const mutation of mutationList){
                    if(mutation.type === "childList"){
                        mutation.addedNodes.forEach(node => {
                            if(node instanceof HTMLTableRowElement) enableDragFor(node);
                        });
                    }
                }
            }).observe(table, { childList: true });
        });
    
        let dropZone = document.getElementById("drop-zone");
        // cancel dragover to allow drop
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
        });
        // process drag and drop
        dropZone.addEventListener("drop", async (e) => {
            e.preventDefault();
            e.target.innerHTML = "";
            const data = JSON.parse(e.dataTransfer.getData("text"));
            e.target.append(el({
                tagName: "li",
                innerText: data.name
            }), el({
                tagName: "li",
                innerText: data.dob
            }));
            new Patient().getPatient(data.patient_id, data.visit_id).then(patient => {
                chrome.storage.local.set({currentPatient: patient});
            });
        });
    }
    enableHideDocument() {
        const hideDocument = function () {
            document.querySelectorAll("[name^=Documents_]").forEach(tr => {
                tr.querySelectorAll("a").forEach((a, i, array) => {
                    if(i === array.length) a.addEventListener("click",(e) => {
                        setTimeout(() => { // let the target get there first
                            const target = document.querySelector("[name=is_incorrect_c]");
                            target.parentElement.innerHTML = "";
                            target.parentElement.append(el({
                                tagName: "button",
                                classList: ["axis-extension-toggle-button--incomplete"],
                                innerText: "Hide Document",
                                listeners: [
                                    new Listener("click", function (e) {
                                        const id = e.target.closest("tr").getAttribute("name").replace(/Documents_/g,"");
                                        fetch(`https://axis.thejoint.com/rest/v11_24/Documents/${id}
                                            ?view=record
                                            &allowBatching=true
                                            &erased_fields=true
                                            &viewed=1`, {
                                                method: "PUT",
                                                body: {
                                                    id: id,
                                                    is_incorrect_c: true
                                                }
                                        }).then(res => {
                                            if(res.ok) ; else {
                                                console.error(res.statusText);
                                            }
                                        });
                                    }, {once: true})
                                ]
                            }));
                        },0);
                    });
                });
            });
        };
        // enable hide document immediately
        hideDocument();
        // and with table pagination
        document.querySelectorAll("[data-subpanel-link=documents] button[data-action^=paginate]").forEach(button => {
            button.addEventListener("click", () => {
                setTimeout(hideDocument, 0); // let the documents get there first
            });
        });
    }
    enableTabs(){
        document.querySelectorAll("md-tabs").forEach(tablist => {
            tablist.addEventListener('change', (e) => {
                setTimeout(() => {
                    e.target.childNodes.forEach(tab => {
                        if(tab.hasAttribute("active")) document.getElementById(tab.getAttribute("aria-controls")).hidden = false;
                        else document.getElementById(tab.getAttribute("aria-controls")).hidden = true;
                    });
                },0);
            });
        });
    }
}

function frontOfficeFetch(resource = "", options = {}){
    return chrome.runtime.sendMessage({
        type: "fetch",
        resource: resource,
        options: options
    }).then(res => {
        if (!res) throw new Error("No response received from background script.");
        return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            headers: new Headers(res.headers),
            url: res.url,
            json: async () => {
                const text = res.isBinary 
                    ? new TextDecoder().decode(new Uint8Array(res.body)) 
                    : res.body;
                return JSON.parse(text);
            },
            text: async () => {
                res.isBinary ? new TextDecoder().decode(new Uint8Array(res.body)) : res.body;
            },
            arrayBuffer: async () => {
                if (res.isBinary) return new Uint8Array(res.body).buffer;
                return new TextEncoder().encode(res.body).buffer;
            }
        };
    });
}

class User {
    constructor(){
        this.authorizedClinics = [];
        this.clinic = {
            id: null,
            name: null,
            address: {
                street: null,
                city: null,
                state: null,
                zip: null
            },
            phone: null,
            email: null,
            entity: null,
            company: null
        };
        this.credential = null; 
        this.currentApp = new App();
        this.email = null;
        this.id = null;
        this.isBetaUser = false;
        this.isPrimaryUser = null;
        this.name = null;
        this.prefix = null;
        this.role = null;
        this.settings = {};
        this.username = null;
    }
    get csrfToken() {
        try {
            if(this.currentApp.isBackOffice){
                return document.querySelector("meta[name=csrf-token]").content;
            } else {
                throw new Error(`csrf-token cannot be accessed from front office.`);
            }
        } catch (error) {
            console.error(error);
            return "";    
        }
    }
    get oauthToken() {
        try {
            if(this.currentApp.isFrontOffice) {
                return localStorage.getItem("prod:SugarCRM:AuthAccessToken");
            } else {
                throw new Error(`oauthToken cannot be accessed from back office.`);
            }
        } catch (error) {
            console.error(error);
            return "";    
        }
    }
    getUser() {
        return new Promise((resolve, reject) => {
            // get current user from front office
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/me").then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            // update user
            this.name = json.current_user.full_name;
            this.username = json.current_user.user_name;
            if(/dr./i.test(this.username)) {
                this.credential = "DC";
                this.prefix = "Dr.";
                this.role = "Doctor of Chiropractic";
            } else {
                this.role = "Wellness Coordinator";
            }
            this.id = json.current_user.id;
            this.email = json.current_user.email.email_address;
            this.clinic = {
                id: json.current_user.clinic_id,
                name: json.current_user.clinic_name
            };
            this.isBetaUser = json.current_user.beta_features;

            // check if this is the primary user
            return contentStorage.get("primaryUser", "sync").then(record => {
                if(record.results.primaryUser.username === this.username) {
                    this.isPrimaryUser = true;
                    this.settings = primaryUser.settings;
                } else if(record.results.primaryUser === null) {
                    // sync storage has not been enabled
                    // the user defaults to primary
                    this.isPrimaryUser = true;
                    // settings are not defined
                } else {
                    // this is a guest user
                    this.isPrimaryUser = false;
                }
                // allow chaining
                return this;
            })
        }).catch(error => { console.error(error); return this; });
    }
    getClinic(){
        new Promise((resolve, reject) => {
            // reject if clinic id is unset
            if(!(this.clinic.id)) reject(new Error(`Clinic ${this.clinic.id} is invalid. Call method getUser() before getClinic().`));
            // get current clinic from front office
            frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/TJ_Clinics/${this.clinic.id}?erased_fields=true&view=record`).then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            this.clinic.name = json.name;
            this.clinic.address.street = json.billing_address_street;
            this.clinic.address.city = json.billing_address_city;
            this.clinic.address.state = json.billing_address_state;
            this.clinic.address.zip = json.billing_address_postalcode;
            this.clinic.phone = json.phone1;
            this.clinic.email = json.email;
            this.clinic.company = json.pc;
            // ? business is misspelled occasionally
            this.clinic.entity = json.bussiness_entity ? json.bussiness_entity: json.business_entity;
            // allow chaining
            return this;
        }).catch(error => { console.error(error); return this; });
    }
    getAuthorizedClinics(){
        new Promise((resolve, reject) => {
            // get all clinics that the user can access
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/Dashboards/enum/clinicslist").then(res => {
                if(res.ok) res.json().then(json => { resolve(json); });
                else reject(new Error(res.statusText));
            });
        }).then(json => {
            const requests = [];
            for(const key of Object.keys(json)){
                requests.push({
                    type: "GET",
                    dataType: "json",
                    timeout: 180000,
                    contentType: "application/json",
                    url: `https://axis.thejoint.com/rest/v11_24/TJ_Clinics/${key}?erased_fields=true&view=record`
                });

            }
            const authorizedClinic = (record = {}) => {
                return {
                    name: record.name,
                    address: {
                        street: record.billing_address_street,
                        city: record.billing_address_city,
                        state: record.billing_address_state,
                        zip: record.billing_address_postalcode
                    },
                    phone: record.phone1,
                    email: record.email,
                    company: record.pc,
                    entity: record.bussiness_entity ? record.bussiness_entity : record.business_entity
                }
            };
            frontOfficeFetch("https://axis.thejoint.com/rest/v11_24/bulk",{
                body: { requests: requests}
            }).then(res => {
                if(res.ok) {
                    res.json().then(json => {
                        if(is.array(json.contents.records)){
                            for(const record of json.contents.records){
                                this.authorizedClinics.push(authorizedClinic(record));  
                            }
                            // allow chaining
                            return this;
                        } else {
                            throw new Error (`Records must be type of array. Received ${typeof json.contents.records}.`);
                        }
                    });
                } else {
                    throw new Error(res.statusText);
                }
            });
        }).catch(error => { console.error(error); return this; });
    }
}

// inject script dependencies
document.body.append(
    document.createComment("praktiki for axis"),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/components.js")
    }),
    el({
        tagName: "script",
        attributes: {defer: "", type: "module"},
        src: chrome.runtime.getURL("scripts/pdf.js")
    })
);

const user = new User();

user.currentApp.connectCoreUI();
