let nextEpisodeTime;
let show = true;
let nextSeason, nextEpisode, element, videoElement;

console.log = (txt) => {
    window.console.info(`MovieBoxNext| ${txt}`);
};

// Requests the time left before the button should show, set by the user.
chrome.storage.sync.get("time", ({ time }) => {
    nextEpisodeTime = time;
})

// When user changes settings this will update dynamically on the page without reloading.
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.time)
        nextEpisodeTime = changes.time.newValue;
})

// Event listeners on every episode section.
$('a[season][episode]').click(e => {
    userSelectedEpisode(
        $(e.currentTarget).attr('season'),
        $(e.currentTarget).attr('episode'))
});

// If the URL has 'MovieBoxNext' in it, it will play the requested episode. This url has been generated earlier when the next button is pressed by the user.
const param = new URLSearchParams(window.location.search);
if (param.get('MovieBoxNext'))
    if (typeof param.get('episode') !== 'undefined')
        playEpisode(param.get('season'), param.get('episode'));
    else
        playEpisode(param.get('season'), 1)

/**
 * Will click on the episode that's being requested.
 * @param {Number} season Desired season
 * @param {Number} episode Desired episode
 */
function playEpisode(season, episode) {
    $('a[season][episode]').each((i, e) => {
        let se = $(e).attr('season');
        let ep = $(e).attr('episode');

        if (parseInt(se) === parseInt(season) && parseInt(ep) === parseInt(episode)) {
            e.click();
            return false;
        }
    });
}

/**
 * Fires when a user clicks on an episode.
 * @param {Number} season Season user clicked on
 * @param {Number} episode Episode user clicked on
 */
function userSelectedEpisode(season, episode) {
    console.log(`User clicked on an episode | s${season}:e${episode}`);
    show = true;
    setNextEpisode(season, episode);
}

/**
 * Generates the URL needed to play the next episode.
 * @param {Number} season Desired season
 * @param {Number} episode Desired episode
 * @return {String} desired URL 
 */
function generateUrl(season, episode) {
    let baseUrl = window.location.href;
    baseUrl = baseUrl.substring(0, baseUrl.indexOf("?"));
    baseUrl += `${baseUrl.includes("?") ? "&" : "?"}season=${season}`;
    baseUrl += `&episode=${episode ? episode : 1}`;
    baseUrl += "&MovieBoxNext=1";
    return baseUrl;
}

/**
 * Retrieves the current season and episode which are displayed in the URL by moviebox itself.
 * @return {Object} Containing the current season (s) and episode (e)
 */
function getShowInfo() {
    const defaultResponse = { s: "1", e: "1" }

    const url = $('.play_btn').first().attr('play');
    const data = /.*season=(?<season>\d*)&episode=(?<episode>\d*)/.exec(url);

    if (!data) return defaultResponse;

    if (data.groups.episode && data.groups.season)
        return { s: data.groups.season, e: data.groups.episode };

    return defaultResponse;
}

/**
 * Get the next episode after the current one. If the current episode is the last one of it's season,
 * it will try and see if there is a season after the current one and return that season. If there isn't a next season
 * that means that the user has finished this serie and it won't show a next button.
 * @param {Number} currentSeason 
 * @param {Number} currentEpisode
 * @return {Promise} Promise object represents the next episode
 */
async function getNextEpisode(currentSeason, currentEpisode) {
    return new Promise(async resolve => {
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
            const episodesInSeason = await checkForEpisodes(cs + 1);
            if (episodesInSeason)
                resolve({ season: cs + 1, episode: 1 });
            else {
                show = false;
                resolve({ season: undefined, episode: undefined });
            }
        } else {
            console.log(`Next episode found: s${cs}:e${ce + 1}`);
            resolve({ season: cs, episode: ce + 1, a: found });
        }
    })
}

/**
 * Checkes given season for realness.
 * Since moviebox still shows the page even if the season doesn't exists,
 * the page is being fetched and checked if it contains episodes.
 * @param {Number} season 
 * @return {Boolean} Represents if the season exists or not
 */
async function checkForEpisodes(season) {
    try {
        const fetched = await fetch(generateUrl(season));
        const text = await fetched.text();
        const episodes = text.match(/class="tv_episode"/gm);
        if (!episodes)
            return false;
        else
            return true;
    } catch (e) {
        return false;
    }
}

// Set video element when it's visible on screen.
function setVideoElement() {
    if ($('video').length)
        videoElement = $('video')[0];
}

/**
 * VideoData needed to see how far in the episode the user is.
 * @return {Object} Videodata containing total duration of the episode and the time the user is currently at
 */
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

// Displays the next button, when clicked the user will be redirected to the url being generated by `generateUrl()`
function showNextEpisodeButton() {
    if ($("#MovieBoxNextEpisodeButton").length) return;
    try {
        let url = generateUrl(nextSeason, nextEpisode);
        $('div[class="jw-media jw-reset"]')[0].insertAdjacentHTML('afterbegin', `
        <a href="${url}" id="MovieBoxNextEpisodeButton">
            <div class="MovieBoxNext_Button_Container"
                id="MovieBoxNextEpisodeButton">
                <button class="MovieBoxNext_Button">
                    NEXT &gt;
                </button>
            </div>
        </a>`)
    } catch (e) {
        setVideoElement();
    }
}

// Hides the next button if being displayed.
function hideNextEpisodeButton() {
    if ($("#MovieBoxNextEpisodeButton").length)
        $("#MovieBoxNextEpisodeButton").remove();
}

/**
 * Will set next episode and corresponding season.
 * When no parameters are provided it wil retrieve the current episode and season.
 * @param {Number|undefined} se Represents current episodes season 
 * @param {Number|undefined} ep Represents current episode
 */
async function setNextEpisode(se, ep) {
    if (!se && !ep) {
        let { s, e } = getShowInfo();
        se = s;
        ep = e;
    }

    let s = se;
    let e = ep;

    let { season, episode, a } = await getNextEpisode(s, e);
    nextSeason = season;
    nextEpisode = episode;
    element = a;
}

/**
 * Every 2 seconds the required variables are being checked and set if not set yet.
 * Once the time left in the episode is less than the preffered (set by user) time left the button will appear
 */ 
setInterval(() => {
    if (!show) return;

    // URL contains 'tvdetail' when a series is selected. This won't be on movies and the homescreen.
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