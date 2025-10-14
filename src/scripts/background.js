// listen for action-icon-click
chrome.action.onClicked.addListener(async () => {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    // notify content.js of action-icon-click
    await chrome.tabs.sendMessage(tab.id, {
        source: {
            event: "action-icon-click",
            type: "service-worker",
            file: "background.js"
        },
        body: {
            
        }
    });
});

chrome.runtime.onMessage.addListener(async (message, sender, response) => {
    switch(message.source.event){
        case "back-office-login":
            await chrome.tabs.create({
                active: false,
                url: "https://axis.thejoint.com/login"
            }).then(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    ok: true,
                    source: {
                        event: "sync-login",
                        type: "service-worker",
                        file: "background.js"
                    },
                    body: message.body
                }, async (res) => {
                    if(res.ok){
                        response(Object.assign(await res.json(), {ok: true, tab: tab.id}));
                    } else {
                        chrome.tabs.remove(tab.id);
                        response(res);    
                    }
                });
            
            });
            break;
    }
});