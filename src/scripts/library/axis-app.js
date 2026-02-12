import { kebabCase } from "../_string";
import { el, Listener } from "../_element.mjs";
import { contentStorage } from "./chrome-storage";
import { toMS } from "../_date.mjs";
export class App {
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
                if(document.querySelector("#CompletedVisitData")) {
                    // * completed visit
                } else {
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
            case "tasks":
            case "tj_clinics":
            case "tj_custom_reports":
            default:
                // do nothing
                break;
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
            }
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
                            target.parentElement.innerHTML = ""
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
                                            if(res.ok) {
                                                // TODO: give user option to undo
                                            } else {
                                                console.error(res.statusText);
                                            }
                                        });
                                    }, {once: true})
                                ]
                            }));
                        },0)
                    });
                });
            });
        }
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

export function frontOfficeFetch(resource = "", options = {}){
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
                res.isBinary ? new TextDecoder().decode(new Uint8Array(res.body)) : res.body
            },
            arrayBuffer: async () => {
                if (res.isBinary) return new Uint8Array(res.body).buffer;
                return new TextEncoder().encode(res.body).buffer;
            }
        };
    });
}

export function frontOfficeRefresh(){
    contentStorage.get("refreshToken","sync").then(record => {
        if(record.ok) frontOfficeFetch(`https://axis.thejoint.com/rest/v11_24/oauth2/token?platform=base`,{
                method: "POST",
                body: {
                    "grant_type": "refresh_token",
                    "refresh_token": record.results.refreshToken,
                    "refresh": true
                }
            }).then(res => {
                if(res.ok) {
                    // update tokens
                    res.json().then(json => {
                        contentStorage.set({
                            oauthToken: json.access_token
                        }, "sync", toMS.s(json.expires_in)).then(error => {
                            if(error) console.error(error);
                        });
                        contentStorage.set({
                            refreshToken: json.refresh_token
                        }, "sync", toMS.s(json.refresh_expires_in)).then(error => {
                            if(error) console.error(error);
                        });
                        contentStorage.set({
                            downloadToken: json.download_token
                        }, "sync").then(error => {
                            if(error) console.error(error);
                        });
                    });
                    // avoid conflict with open front office
                    if(window.location.hostname === "axis.thejoint.com") {
                        // store tokens locally
                        localStorage.setItem("prod:SugarCRM:AuthAccessToken", res.access_token);
                        localStorage.setItem("prod:SugarCRM:AuthRefreshToken", res.refresh_token);
                        localStorage.setItem("prod:SugarCRM:DownloadToken", res.download_token);
                    }
                } else {
                    throw new Error(res.statusText);
                }
            });
        else console.error(result.statusText);
    });
}
