chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    try{
        switch(req.type) {
            case "storage":
                if(req.method === "get") chrome.storage[req.location].get(query).then(records => {
                    for(const key of query) {
                        // add each matching record to an array
                        const recordsArray = [];
                        if(records[key]) { // only if the record exists
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
                            results: recordsArray
                        });
                    }
                });
                else if(req.method === "set") for(const [key, val] of Object.entries(req.body)){
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
                return true;
            case "fetch":
                // add the oauth token before fetching
                chrome.storage.sync.get("oauthToken").then(records => {
                    // only if the token has been stored
                    // ! don't send token with login requests
                    if(records && req.resource !== "https://axis.thejoint.com/rest/v11_24/oauth2/token?platform=base") {
                        req.options.headers = {
                            "OAuth-Token": records.oauthToken ? records.oauthToken.body : "" 
                        };
                    }
                    // add oauth to bulk requests, if applicable
                    if(req.options.body.requests) req.options.body.requests.forEach(request => {
                        request.options.headers = {
                            "OAuth-Token": records.oauthToken ? records.oauthToken.body : "" 
                        };
                    });
                    // stringify body (to prevent 422 error)
                    if(typeof req.options.body === "object") req.options.body = JSON.stringify(req.options.body);
                    // fetch the resource
                    fetch(req.resource, req.options).then(response => {
                        const result = {
                            ok: response.ok,
                            status: response.status,
                            statusText: response.statusText,
                            headers: Object.fromEntries(response.headers.entries()),
                            url: response.url
                        };
                        const contentType = response.headers.get("content-type") || "";
                        if (contentType.includes("application/pdf") || req.resource.includes("download=true")) {
                            response.arrayBuffer().then(buffer => {
                                result.body = Array.from(new Uint8Array(buffer));
                                result.isBinary = true;
                                sendResponse(result);
                            });
                        } else {
                            response.text().then(text => {
                                result.body = text;
                                result.isBinary = false;
                                sendResponse(result);
                            });
                        }
                    }).catch(error => {
                        sendResponse({ ok: false, statusText: error.message });
                    });
                });
                return true;
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