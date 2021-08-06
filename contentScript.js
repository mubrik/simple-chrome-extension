console.log("content script")

// data store
const trackObject = {
    trackTitle: "",
    trackArtist: "",
    trackAlbum: "",
    trackYear: "",
    trackDuration: 0,
    trackHalfTimer: 0,
    notifyTrack: false,
    playStatus: "idle",
    bodyData: function() {
        return `artist=${this.trackArtist}&track=${this.trackTitle}`
    },
    setAll: function(listObj) {
        for (const [key, value] of Object.entries(listObj)) {
            this[key] = value;
        }
    },
    setter: function(param, value) {
        this[param] = value;
        console.log(`${param} is now ${value}`);
    }
};

function setupListeners({key}) {

    // check if user has authenticated extension
    console.log(key)
    if (key === undefined) {
        console.log("no key setup");
        return false
    };

    console.log("listeners")
    setTimeout(() => {

        let videoElem = document.querySelector(".html5-video-container").children[0];
        let prevButton = document.querySelector(".left-controls-buttons .previous-button")
        let nextButton = document.querySelector(".left-controls-buttons .next-button")

        videoElem.addEventListener("playing", handlePlayEvent);
        videoElem.addEventListener("pause", handlePauseEvent);
        videoElem.addEventListener("canplay", console.log("canplay"), true)
        prevButton.addEventListener("onclick", handlePreviousClickedEvent);
        nextButton.addEventListener("onclick", handleNextClickedEvent);
        // videoElem.addEventListener("durationchange", handleDurationChangeEvent);

    }, 1000)
    
};

function handlePlayEvent(event) {

    let videoNode = event.target;

    // add error checking later
    // get and set track variables
    setTrackVariables();
    // interval checking for track play time
    trackHalfwayValidator();
    // interval checking of track title
    trackTitleValidator();
    // if no error set now playing status
    trackObject.setter("playStatus", "playing")

    videoNode.removeEventListener("canplay", console.log("canplay"), true);
};

function handlePauseEvent(event) {
    console.log('paused')
    // if no error set now playing status
    trackObject.setter("playStatus", "paused")
};

function handleNextClickedEvent(event) {
    // do something

    // call set variables

    // start halfway validator
};

function handlePreviousClickedEvent(event) {
    // do something

    // check if tracked actually changed or restarted

    // call set variables
};

function setTrackVariables() {

    setTimeout(() => {

        let trackTitle = getCurrentTrackTitle()
            
        // check if track variable already set
        if (isPlayingEqualStore()) {
            // do something
            console.log("same track")
            return false;
        };
        
        // get track artist
        let trackArtist = getCurrentTrackArtist();

        // get track album
        let trackAlbum = getCurrentTrackAlbum();

        // get track year
        let trackYear = getCurrentTrackYear();
    
        // get track timers 
        let [trackDuration, trackHalfTimer] = getCurrentTrackTimers();
    
        console.log(`track artist: ${trackArtist}, album: ${trackAlbum}, year: ${trackYear}`)
    
        // set object
        trackObject.setAll({
            trackTitle,
            trackArtist,
            trackAlbum,
            trackYear,
            trackDuration,
            trackHalfTimer,
            notifyTrack: false
        });

        // update nowplaying on lastfm
        scrobbleNowPlaying();

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

            if (!trackObject.notifyTrack) {
                console.log("halfway reached")
                // update object
                trackObject.setter('notifyTrack', true);
            } else {
                console.log('track past halfway but hasnt changed')
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

    let trackCurrentTime = getTrackBarCurrentTimer();
    console.log(`current track time: ${trackCurrentTime}`)
    console.log(`obj track half time: ${trackObject.trackHalfTimer}`)
    console.log(trackObject.bodyData())
    // check if track has past halfway duration
    if (trackCurrentTime >= trackObject.trackHalfTimer) {
        return true
    } else {
        return false
    }
};

function isPlayingEqualStore() {
    // compare playing title and store obj title
    let playingTitle = getCurrentTrackTitle();
    return (playingTitle === trackObject.trackTitle)
};

function getSessionKey(callback) {
    // set callback
    _callback = callback || function(result) {
        console.log(`${result.scrobblerLastFM} key has been restored`)
    }
    // gets the session key and runs a callback function
    chrome.storage.sync.get(['scrobblerLastFM'], ({scrobblerLastFM}) => _callback(scrobblerLastFM));
};

function lastFmConnector(requestObj, callback) {
    // connects to ext script
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage("kafichdgndnfkcfgnbfjhfdbhclfhmpf",_req, _call);

};

function scrobbleNowPlaying() {
    // data 
    let method = "POST";
    let fmMethod = "track.updateNowPlaying";
    let bodyData = trackObject.bodyData();

    // call method
    lastFmConnector({
        method,
        fmMethod,
        bodyData,
        type: "authreq"
    },
    function(response) {
        console.log(response.msg)
    }
    );
};

document.addEventListener('load', getSessionKey(setupListeners));