import { is } from "./_type.mjs";
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    try{
        switch(request.type) {
            case "storage":
                if(req.method === "get") {
                    chrome.storage[req.location].get(query).then(records => {
                        for(const key of query) {
                            if(records[key]) {
                                if(req.sameOrigin){
                                    if (records[key].tabId === sender.tab.id) {
                                        recordsArray.push({
                                            [key]: records[key].body
                                        });
                                    }
                                } else {
                                    recordsArray.push({
                                        [key]: records[key].body
                                    });
                                }
                            }
                            sendResponse({
                                ok: true,
                                statusText: "OK",
                                json: async () => {
                                    return { results: recordsArray };
                                }
                            });
                        }
                    });
                } else if(req.method === "set") {
                    for(const [key, val] of Object.entries(req.body)){
                        chrome.storage[req.location].set({
                            [key]: {
                                tabId: sender.tab.id,
                                url: sender.url,
                                timestamp: new Date().getTime(),
                                expiration: req.expires,
                                get expired() { return this.expiration < new Date().time() },
                                body: val
                            }
                        });
                    }
                    sendResponse({
                        ok: true,
                        statusText: "OK"
                    });
                }
                break;
            case "fetch":
                // add the oauth token before fetching
                chrome.storage.local.get("oauthToken").then(records => {
                    req.options.headers["OAuth-Token"] = records.oauthToken.value;
                    
                    // add oauth to bulk requests
                    if(is.array(req.options.requests)) req.options.requests.forEach(request => {
                        request.options.headers["OAuth-Token"] = records.oauthToken.value;
                    });
                    // now fetch the resource
                    fetch(req.resource, req.options).then(response => {
                        if(response.ok) {
                            sendResponse(response);
                        } else if(response.status === 401){

                        }
                    });
                })
        }
    } catch (error) {
        console.error(error);
        sendResponse({
            ok: false,
            statusText: error
        });
    }
});

const storage = {
    clean: () => {
        for(const location of ["local", "session", "sync"]){
            const now = new Date().getTime();
            const staged = [];
            chrome.storage[location].get(null).then(records => {
                for(const [key, record] of Object.entries(records)) {
                    if(record.expiration > now) staged.push(record);
                }
            });
            chrome.storage[location].remove(staged).then(error => {
                if(error) console.error(error);
            });
        }
    }
}