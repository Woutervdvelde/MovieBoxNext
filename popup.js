 let changeTime = document.getElementById("time");

 chrome.storage.sync.get("time", ({time}) => {
     changeTime.value = time;
 })

changeTime.addEventListener('change', async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: setPageTime,
    })
})


 function setPageTime() {
    document.body.style.backgroundColor = "black";
 }