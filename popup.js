let changeTime = document.getElementById("time");
let saveButton = document.getElementById("save");

chrome.storage.sync.get("time", ({time}) => {
    changeTime.value = time;
})

changeTime.addEventListener('change', () => {
    setTime(changeTime.value)
})

saveButton.addEventListener('click', () => {
    setTime(changeTime.value)
})

const setTime = async (time) => {
    chrome.storage.sync.set({time: time}, () => {
        console.log(`updated time to ${time}`)
    });
}