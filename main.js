console.log = (txt) => {
    window.console.info(`MovieBoxNext| ${txt}`);
};

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.time)
        nextEpisodeTime = changes.time.newValue;
})

let nextEpisodeTime;
let show = true;
let nextSeason, nextEpisode, element, videoElement;


$('a[season][episode]').click(e => {
    userSelectedEpisode(
        $(e.currentTarget).attr('season'),
        $(e.currentTarget).attr('episode'))
});

const param = new URLSearchParams(window.location.search);
if (param.get('MovieBoxNext'))
    if (typeof param.get('episode') !== 'undefined')
        playEpisode(param.get('season'), param.get('episode'));
    else
        playEpisode(param.get('season'), 1)

function playEpisode(season, episode) {
    $('a[season][episode]').each((i, e) => {
        let se = $(e).attr('season');
        let ep = $(e).attr('episode');

        if (parseInt(se) === parseInt(season) && parseInt(ep) === parseInt(episode)) {
            e.click();
            return false;
        }
    });
    setTimeout(() => {
        goFullscreen();
    }, 1000);
}

function goFullscreen() {
    const video = document.getElementsByTagName('video')[0];

    if (!video) {
        setTimeout(() => { goFullscreen() }, 1000);
        return;
    }

    if (video.webkitRequestFullScreen)
        video.webkitRequestFullScreen();
    else
        console.log("Unable to trigger fullscreen");
}

//check if MovieBoxNext is in the url, if it is it means that the script tries to play the first episode of a new season
if (window.location.href.includes("MovieBoxNext")) {

}

function userSelectedEpisode(season, episode) {
    console.log("User clicked on it's own");
    setNextEpisode(season, episode);
}

function generateUrl(season, episode) {
    let baseUrl = window.location.href;
    baseUrl = baseUrl.substring(0, baseUrl.indexOf("&"));
    baseUrl += `&season=${season}`;
    baseUrl += `&episode=${episode}`;
    baseUrl += "&MovieBoxNext=1";
    return baseUrl;
}

chrome.storage.sync.get("time", ({ time }) => {
    nextEpisodeTime = time;
})

function getShowInfo() {
    const defaultResponse = { s: "1", e: "1" }

    const url = $('.play_btn').first().attr('play');
    const data = /.*season=(?<season>\d*)&episode=(?<episode>\d*)/.exec(url);

    if (!data) return defaultResponse;

    if (data.groups.episode && data.groups.season)
        return { s: data.groups.season, e: data.groups.episode };

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
        return { season: cs + 1, episode: 1 }
    } else {
        console.log(`Next episode found: s${cs}:e${ce + 1}`);
        return { season: cs, episode: ce + 1, a: found }
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
        return { duration: duration, currentTime: currentTime };
    } catch (e) {
        setVideoElement();
    }
}

function showNextEpisodeButton() {
    console.log("Displaying next button");
    try {
        let url = generateUrl(nextSeason, nextEpisode);
        $('div[class="jw-media jw-reset"]')[0].insertAdjacentHTML('afterbegin', `
        <a href="${url}" id="MovieBoxNextEpisodeButton">
        <div style="
        width: 150px;
        height: 50px;
        position: absolute;
        background-color: #1E1E1E;
        z-index: 100000000;
        right: 0;
        bottom: 100px;
        border-radius: 15px;"
        id="MovieBoxNextEpisodeButton">
            <button style="
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10%;
    font-family: Helvetica;
    background: inherit;
    color: white;
    ">
                NEXT &gt;
            </button>
        </div></a>`)
    } catch (e) {
        setVideoElement();
    }
}

function hideNextEpisodeButton() {
    if ($("#MovieBoxNextEpisodeButton").length)
        $("#MovieBoxNextEpisodeButton").remove();
}

function setNextEpisode(se, ep) {
    if (!se && !ep) {
        let { s, e } = getShowInfo();
        se = s;
        ep = e;
    }

    let s = se;
    let e = ep;

    let { season, episode, a } = getNextEpisode(s, e);
    nextSeason = season;
    nextEpisode = episode;
    element = a;
}

setInterval(() => {
    if (!show) return;

    //url contains 'tvdetail' when a series is selected. This won't be on movies and the homescreen.
    if (!window.location.href.includes('tvshow'))
        show = false;

    if (typeof nextSeason === 'undefined' || typeof nextEpisode === 'undefined') {
        setNextEpisode();
        return;
    }

    if (!videoElement) {
        setVideoElement();
        return;
    }

    const videoData = getVideoData();

    if (videoData.duration - videoData.currentTime < nextEpisodeTime) {
        showNextEpisodeButton();
    } else
        hideNextEpisodeButton();

}, 2 * 1000)