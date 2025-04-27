// listen for action-icon-click
chrome.action.onClicked.addListener(async () => {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    // notify content.js of action-icon-click
    await chrome.tabs.sendMessage(tab.id, { 
        source: {
            name: "action",
            event: "action-icon-click",
            type: "service-worker",
            file: "background.js"
        },
    });
});