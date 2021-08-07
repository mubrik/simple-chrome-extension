console.log("content script")

// data store
const trackObject = {
    trackTitle: "",
    isNowPlaying: false,
    isScrobbled: false,
    playStatus: "idle",
    setAll: function(listObj) {
        for (const [key, value] of Object.entries(listObj)) {
            this[key] = value;
        }
    },
    setter: function(param, value) {
        this[param] = value;
        console.log(`${param} is now ${value}`);
    },
    resetAll: function (){
        this.trackTitle = "",
        this.isNowPlaying = false,
        this.isScrobbled = false,
        this.playStatus  = "idle"
        console.log(this.trackTitle)
    }
};

class Track {

    constructor() {
        this.title = getCurrentTrackTitle();
        this.artist = getCurrentTrackArtist();
        this.year = getCurrentTrackYear();
        this.album = getCurrentTrackAlbum();
        this.timers = getTrackTimes();
    }
}

function setupListeners() {

    console.log("listeners")
    setTimeout(() => {

        let videoElem = document.querySelector(".html5-video-container").children[0];
        let prevButton = document.querySelector(".left-controls-buttons .previous-button")
        let nextButton = document.querySelector(".left-controls-buttons .next-button")

        videoElem.addEventListener("playing", handlePlayEvent);
        videoElem.addEventListener("pause", handlePauseEvent);
        prevButton.addEventListener("onclick", handlePreviousClickedEvent);
        nextButton.addEventListener("onclick", handleNextClickedEvent);

    }, 1000)
    
};

function handlePlayEvent(event) {

    // add error checking later
    // get and set track variables
    setTrackVariables();

    // if no error set now playing status
    trackObject.setter("playStatus", "playing")
};

function handlePauseEvent(event) {
    console.log('paused')
    // if no error set now playing status
    trackObject.setter("playStatus", "paused")
};

function handleNextClickedEvent(event) {
    // call set variables
    console.log("next cicked")
    setTrackVariables()
};

function handlePreviousClickedEvent(event) {
    // reset obj so track can be scrobbled again
    console.log("prev cicked")
    trackObject.resetAll();

    // call set variables
    setTrackVariables();
};

function getTrackTimes() {

    let timeElement = document.querySelector(".time-info").innerText.split("/")
    let currentTime = timeElement[0]
    let trackLength = timeElement[1]

    return [formatTimeValue(currentTime), formatTimeValue(trackLength)]
}

function formatTimeValue(str) {
    // split time
    let timeArr = str.split(":")

    // convert to int and multiply to get millisec
    let minutes = parseInt(timeArr[0]) * 60000
    let seconds = parseInt(timeArr[1]) * 1000

    return minutes + seconds;
}

function setTrackVariables() {

    setTimeout(() => {

        // get track title
        let trackTitle = getCurrentTrackTitle()
            
        // check if track variable already set
        if (isPlayingEqualStore()) {
            // do something
            console.log("same track")
            return false;
        };
        
        // set object
        trackObject.setAll({
            trackTitle,
            isNowPlaying: false,
            isScrobbled: false,
        });

        // interval checking for track play time
        trackHalfwayValidator();

        // interval checking of track title
        trackTitleValidator();

        // update nowplaying on lastfm and update object
        lastFmConnector({
            type: "nowPlaying",
            track: new Track()
        },
        function(){
            trackObject.setter('isNowPlaying', true);
        }
        )

        return true;
    
    }, 2000)

};

function trackTitleValidator() {

    let mainChecker = setInterval(() => {

        if (isPlayingEqualStore()) {return}
        else {
            console.log("track changed")
            setTrackVariables()
        }
    
    }, 20000)
};

function trackHalfwayValidator() {

    let mainChecker = setInterval(() => {

        if (trackObject.playStatus === "paused") {
            console.log("track is paused");
            return false;
        }

        if (isTrackHalfway()) {

            if (!trackObject.isScrobbled) {
                console.log("halfway reached")
                // scrobble and update object
                lastFmConnector({
                    type: "scrobble",
                    track: new Track()
                },
                function(){
                    trackObject.setter('isScrobbled', true);
                    clearInterval(mainChecker);
                    console.log('track past halfway and has been scrobbled')
                }
                );
            } else {
                // maybe implement loging for scrobbling errors
            }
            
        } else {
            console.log("not halfway yet")
        }
    }, 25000)

};

function getTrackDuration() {

    // trackbar
    let progressBar = document.getElementById("progress-bar");

    // duration 
    let trackDuration = parseInt(progressBar.getAttribute("aria-valuemax"));

    return trackDuration;

};

function getTrackBarCurrentTimer() {

    // trackbar
    let progressBar = document.getElementById("progress-bar");

    // duration 
    let trackDuration = parseInt(progressBar.getAttribute("value"));

    return trackDuration;

};

function getCurrentTrackTimers() {

    // duration 
    let trackDuration = getTrackDuration();

    // half duration 
    let trackHalfTimer = trackDuration/2

    return [
        trackDuration,
        trackHalfTimer
    ];
};

function getCurrentTrackTitle() {
    let titleElement = document.querySelector('.middle-controls .title');
    return titleElement.innerText;
};

function getCurrentTrackArtist() {
    let artistElement = document.querySelector(".middle-controls .complex-string").children[0];
    return artistElement.innerText;
};

function getCurrentTrackAlbum() {
    // hit or miss on correct album
    let albumElement = document.querySelector(".middle-controls .complex-string").children[2];
    return albumElement.innerText;
};

function getCurrentTrackYear() {
    let yearElement = document.querySelector(".middle-controls .complex-string").children[4];
    return yearElement.innerText;
};

function isTrackHalfway() {

    /* let trackCurrentTime = getTrackBarCurrentTimer();
    console.log(`current track time: ${trackCurrentTime}`)
    console.log(`obj track half time: ${trackObject.trackHalfTimer}`)
    console.log(trackObject.bodyData())
    // check if track has past halfway duration
    if (trackCurrentTime >= trackObject.trackHalfTimer) {
        return true
    } else {
        return false
    } */

    let [current, duration] = getTrackTimes();
    let half = duration / 2
    return (current >= half)
};

function isPlayingEqualStore() {
    // compare playing title and store obj title
    let playingTitle = getCurrentTrackTitle();
    return (playingTitle === trackObject.trackTitle)
};

function lastFmConnector(requestObj, callback) {
    // connects to background script
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);

};

document.addEventListener('load', setupListeners());