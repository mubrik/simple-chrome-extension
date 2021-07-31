console.log("content script")

// data store
let trackObject = {
    trackTitle: "",
    trackArtist: "",
    trackDuration: 0,
    trackHalfTimer: 0,
    notifyTrack: false,
    playStatus: "idle"
};

let trackStatus = {
    playStatus: "idle"
};

function setupListeners() {

    console.log("listeners")
    setTimeout(() => {

        let videoElem = document.querySelector(".html5-video-container").children[0];

        videoElem.addEventListener("playing", handlePlayEvent);
        videoElem.addEventListener("pause", handlePauseEvent);
        videoElem.addEventListener("canplay", console.log("canplay"), true)
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
    trackObject.playStatus = "playing"

    videoNode.removeEventListener("canplay", console.log("canplay"), true);
};

function handlePauseEvent(event) {
    console.log('paused')
    // if no error set now playing status
    trackObject.playStatus = "paused"
};

function setTrackVariables() {

    setTimeout(() => {

        let trackTitle = getCurrentTrackTitle()
            
        // check if track variable already set
        if (isPlayingEqualStore()) {
            // do something
            console.log("same track")
            return false;
        }
        
        // get track artist
        let trackArtist = getCurrentTrackArtist()
    
        // get track timers 
        let timers = getCurrentTrackTimers()
    
        console.log(trackArtist, timers)
    
        // set object 
        trackObject = {
            trackTitle,
            trackArtist,
            notifyTrack: false,
            ...timers
        }
    
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

        if (isTrackHalfway()) {

            if (!trackObject.notifyTrack) {
                handleTrackHalfway()
            } else {
                console.log('track past halfway but hasnt changed')
            }
            
        } else {
            console.log("not halfway yet")
        }
    }, 25000)

};

function handleTrackHalfway() {
    // do something
    console.log("halfway reached")
    trackObject.notifyTrack = true
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
    let trackDuration = getTrackDuration()

    // half duration 
    let trackHalfTimer = trackDuration/2

    return {
        trackDuration,
        trackHalfTimer
    }
};

function getCurrentTrackTitle() {
    let titleElement = document.querySelector('.middle-controls .title');
    return titleElement.innerText;
}

function getCurrentTrackArtist() {
    let artistElement = document.querySelector(".middle-controls .complex-string")
    return artistElement.innerText;
}

function isTrackHalfway() {


    let trackCurrentTime = getTrackBarCurrentTimer();
    console.log(`current track time: ${trackCurrentTime}`)
    console.log(`obj track half time: ${trackObject.trackHalfTimer}`)
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


document.addEventListener('load', setupListeners());