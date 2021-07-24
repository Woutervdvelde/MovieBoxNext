 let changeTime = document.getElementById("time");

 chrome.storage.sync.get("time", ({time}) => {
     changeTime.value = time;
 })


changeTime.addEventListener('change', async () => {
    const time = changeTime.value;
    chrome.storage.sync.set({time: time}, () => {
        console.log(`updated time to ${time}`)
    });
})