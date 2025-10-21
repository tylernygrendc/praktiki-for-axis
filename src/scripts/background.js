
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    const url = new URL(tab.url);
    // match side panel content to on axis resource
    if(url.host === "backoffice.thejoint.com"){
        switch(url.pathname.split("/")[1]){
            case "/cert-create":
                await chrome.sidePanel.setOptions({
                    tabId,
                    path: 'markup/back-office-visit.html',
                    enabled: true
                });
                break;
            case "/waiting-queue":
            case "/pending-notes":
            case "/completed-visits":
                await chrome.sidePanel.setOptions({
                    tabId,
                    path: 'markup/back-office-contact.html',
                    enabled: true
                });
                break;
            case "/login":
            case "/patient-search":
            case "/task-management":
            default:
                await chrome.sidePanel.setOptions({
                    tabId,
                    path: 'markup/side-panel-default.html',
                    enabled: true
                });
        }
    } else if(url.host === "axis.thejoint.com"){
        switch(url.hash.split("/")[0]){
            case "home":
            case "contacts":
                await chrome.sidePanel.setOptions({
                    tabId,
                    path: 'markup/front-office-contact.html',
                    enabled: true
                });
                break;
            case "tasks":
            case "tj_clinics":
            case "tj_custom_reports":
            default:
                await chrome.sidePanel.setOptions({
                    tabId,
                    path: 'markup/side-panel-default.html',
                    enabled: true
                });
                break;
        }
    }
    await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});
});

chrome.runtime.onMessage.addListener(async (message, sender, response) => {
    switch(message.source.event){
        case "back-office-login":
            await (async () => {
                try{
                    let res = await fetch("https://axis.thejoint.com/rest/v11_24/oauth2/token", {
                        "method": "POST",
                        "body": {
                            "username": message.body.username,
                            "password": message.body.password,
                            "client_id": "sugar",
                            "platform": "base",
                            "client_secret": "",
                            "current_language": "en_us",
                            "client_info": { "current_language": "en_us" }
                        }
                    })
                    if(res.ok) {
                        res = await res.json();
                        return Object.assign(res, {
                            expires: new Date().getTime() + res.expires_in
                        });
                    } else { throw new Error(res.statusText); }
                } catch (error) {
                    console.error(error);
                    return {
                        "access_token": "",
                        "expires_in": 0,
                        "token_type": "",
                        "scope": null,
                        "refresh_token": "",
                        "refresh_expires_in": 0,
                        "download_token": "",
                        "expires": new Date().getTime()
                    };
                }
            })();
            break;
    }
});