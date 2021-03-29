let time = 60;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ time });
    console.log(`Default time set to %c${time} seconds`, `color: orange`);
});