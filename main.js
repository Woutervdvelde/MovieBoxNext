console.log = (txt) => {
  window.console.info(`MovieBoxNext| ${txt}`);
};

$('a[season][episode]').click(e => {userSelectedEpisode($(e.currentTarget).attr('season'), $(e.currentTarget).attr('episode'))});

function userSelectedEpisode(season, episode) {
    console.log("User clicked on it's own");
    setNextEpisode(season, episode);
}

let nextEpisodeTime;

chrome.storage.sync.get("time", ({time}) => {
    nextEpisodeTime = time;
})

function getShowInfo() {
    const defaultResponse = {s: "1", e: "1"}

    const url = $('.play_btn').first().attr('play');
    const data = /.*season=(?<season>\d*)&episode=(?<episode>\d*)/.exec(url);

    if (!data) return defaultResponse;

    if (data.groups.episode && data.groups.season)
        return {s: data.groups.season, e: data.groups.episode};

    return defaultResponse;
}

function getNextEpisode(currentSeason, currentEpisode) {
    let found = false;
    const cs = parseInt(currentSeason);
    const ce = parseInt(currentEpisode);

    $('a[season][episode]').each((i, a) => {
        const s = parseInt($(a).attr('season'));
        const e = parseInt($(a).attr('episode'));

        if (s === cs && e === ce + 1)
            found = a;
    });

    if (!found) {
        console.log("No next episode in current season found, will try and start next season");
        return {season: cs + 1, episode: 0}
    } else {
        console.log(`Next episode found: s${cs}:e${ce+1}`);
        return {season: cs, episode: ce+1, a: found}
    }
}

function setVideoElement() {
    if ($('video').length)
        videoElement = $('video')[0];
}

function getVideoData() {
    try {
        if (!videoElement.duration) setVideoElement();

        const duration = videoElement.duration;
        const currentTime = videoElement.currentTime;
        return {duration: duration, currentTime: currentTime};
    } catch (e) {
        setVideoElement();
    }
}

function showNextEpisodeButton() {
    try {
        $('div[class="jw-media jw-reset"]')[0].insertAdjacentHTML('afterbegin', `<div style="
    width: 150px;
    height: 50px;
    position: absolute;
    background-color: black;
    z-index: 100000000;
    right: 0;
    bottom: 100px;
    border-radius: 15px;
    "
    id="MovieBoxNextEpisodeButton">
    <button style="
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10%;
    /* top: 50%; */
    background: inherit;
    color: white;
    " onclick="meow()">NEXT &gt;
    </button>
    </div>`)
    } catch (e) {
        setVideoElement();
    }
}

function hideNextEpisodeButton() {
    $("#MovieBoxNextEpisodeButton").remove();
}

function setNextEpisode(se, ep) {
    if (!se && !ep) {
        let {s, e} = getShowInfo();
        se = s;
        ep = e;
    }

    let s = se;
    let e = ep;

    let {season, episode, a} = getNextEpisode(s, e);
    nextSeason = season;
    nextEpisode = episode;
    element = a;
}


let show = true;
let nextSeason, nextEpisode, element, videoElement;

setInterval(() => {
    if (!show) return;

    if (!nextSeason || !nextEpisode) {
        setNextEpisode();
        return;
    }

    if (!videoElement) {
        setVideoElement();
        console.info(videoElement);
        return;
    }
    //TODO check if video is longer than 1 hour, if so set show to false
    const videoData = getVideoData();

    //if video is longer than 70 minutes show will be set to false (current player is probably a movie not a series)
    if (videoData.duration > 70 * 60) show = false

    if (videoData.duration - videoData.currentTime < nextEpisodeTime) {
        showNextEpisodeButton();
    } else
        hideNextEpisodeButton();

}, 2 * 1000)