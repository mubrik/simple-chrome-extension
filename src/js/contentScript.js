/**
* class object holding song details 
*/
class Song {

    constructor() {
        this.title = this.getCurrentTrackTitle();
        this.details = this.getTrackDetails();
        this.artist = this.details ? this.details[0].trim() : null
        this.album = this.details ? this.details[1].trim() : null
        this.year = this.details ? this.details[2].trim() : null 
        this.timers = this.getCurrentTrackTime();
    }

    /** gets track title from player bar
     * @returns {String} 
     * */
    getCurrentTrackTitle() {
        let titleElement = document.querySelector('yt-formatted-string.title.ytmusic-player-bar');
        return titleElement.innerText;
    };

    /** gets track other details from player bar
     * @returns {Array} 
     * */
    getTrackDetails() {
        let trackDetailsElem = document.querySelector('yt-formatted-string.byline.ytmusic-player-bar');
        let detailsList = trackDetailsElem ? trackDetailsElem.textContent.split("•") : null;
        return detailsList;
    };

    // /**@returns {String} */
    // getCurrentTrackArtist() {
    //     let artistElement = document.querySelector(".middle-controls .complex-string").children[0];
    //     return artistElement.innerText;
    // };

    // /**@returns {String} */
    // getCurrentTrackAlbum() {
    //     // hit or miss on correct album
    //     let albumElement = document.querySelector(".middle-controls .complex-string").children[2];
    //     return albumElement.innerText;
    // };

    // /**@returns {String} */
    // getCurrentTrackYear() {
    //     let yearElement = document.querySelector(".middle-controls .complex-string").children[4];
    //     return yearElement.innerText;
    // };

    /**@returns {Array} */
    getCurrentTrackTime() {

        let timeElement = document.querySelector(".time-info").innerText.split("/")
        let currentTime = timeElement[0];
        let trackLength = timeElement[1];
    
        return [this.formatTimeValue(currentTime), this.formatTimeValue(trackLength)]
    };

    /** 
    * @returns {Number} return time in millisec
    * @param {String} string param
    */
    formatTimeValue(str) {
        // split time
        let timeArr = str.split(":")

        if(timeArr.length === 3) {
            // time is in hours

            // convert to int and multiply to get millisec
            let hours = parseInt(timeArr[0]) * 3600000
            let minutes = parseInt(timeArr[1]) * 60000
            let seconds = parseInt(timeArr[2]) * 1000
        
            return hours + minutes + seconds;
        }
    
        // convert to int and multiply to get millisec
        let minutes = parseInt(timeArr[0]) * 60000
        let seconds = parseInt(timeArr[1]) * 1000
    
        return minutes + seconds;
    }

    removeEmojis (string) {
        const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
        return string.replace(regex, '');
    }
};

/* class monitors play progress */
class Tracker {

    constructor(param) {
        this.playingTrack = null;
        this.songId = null;
        this.songMonitor = null;
        this.isSongPlaying = false;
        this.isSongScrobbled = false;
        this.scrobbleAt = param.scrobbleAt || "half";
    };

    setVar(param, value) {
        // updates instance
        this[param] = value
    }

    onPlay() {
        // if loop tracker isnt started
        if (this.songMonitor === null) {
            this.loopTracker();
        }
        // update instance
        this.isSongPlaying = true;
    };

    onPause() {

        // update instance
        this.isSongPlaying = false;
    };

    onSeek() {
        // seeking bar used, also applies if previous clicked
        // check if time has been reset to < 00:05

        // get song
        let _nowPlaying = new Song();

        // get Id
        let _songId = this.getSongId(_nowPlaying);

        if (this.isSongTheSame(_songId)) {
            let [currentTime, _] = _nowPlaying.timers;

            // if track was seeked to < 10secs mark
            if (currentTime <= 10000) {

                // if loop tracker isnt started
                if (this.songMonitor === null) {
                    this.loopTracker();
                }

                // update instance
                this.isSongScrobbled = false;

            }
        }
    };

    /** 
    * @param {string} param
    * @returns {boolean}
    */
    isSongTheSame(param) {
        return (param === this.songId);
    };

    /** 
    * @param {Song} song
    * @returns {Boolean}
    */
    isSongHalfway(song) {

        let [current, duration] = song.timers;

        if (duration <= 30000) {
            // if track is less than 30s, false so never scrobbles
            return false;
        }

        if (this.scrobbleAt === "end") {
            console.log("scrobbling at end")
            // get 90% duration of track
            let timer = duration * 0.9;
            return (current >= timer);
        }

        let timer = duration / 2;
        return (current >= timer);
    };

    /** 
    * @param {Song} song
    * @returns {String}
    */
    getSongId(song) {
        return String(song["artist"]) + String(song["title"]);
    };

    /* main event loop tracker logic,
    performs multiple instance checks,
    if song is the same, or scrobbled
    if song is halway
    started by callback to background script
    */
    loopTracker() {

        this.songMonitor = setInterval(() => {

            // run only if playing
            if (!this.isSongPlaying) {
                return;
            }

            let _songhalfway = false;
            let _songSame = false;

            // get song
            let _nowPlaying = new Song();

            // check if details are not null return if not
            if (typeof _nowPlaying.artist !== "string" &&
                typeof _nowPlaying.title !== "string" ) {
                return;
            };

            // get playing song ID
            let _songId = this.getSongId(_nowPlaying);

            // is song same?
            if (this.isSongTheSame(_songId)) {

                // if scrobbled
                if (this.isSongScrobbled) {
                    console.log("song scrobbled")
                    return;
                }

                _songSame = true;

            } else {
                // song is new
                // store song
                console.log("new song")
                this.playingTrack = _nowPlaying;

                // store id
                this.songId = this.getSongId(_nowPlaying);

                // clear scrobble
                this.isSongScrobbled = false;

                // notify lastfm
                lastFmConnector(
                    {
                        type: "updateLocalNowPLaying",
                        artist: this.playingTrack.artist,
                        title: this.playingTrack.title
                    }
                );
            }

            // check duration
            if (this.isSongHalfway(_nowPlaying)){
                _songhalfway = true;

            }

            // only scrobble if song is same and past halfway
            if (_songhalfway 
                && _songSame) {
                    // scrobble to lastfm
                    lastFmConnector(
                        {
                            type: "scrobble",
                            artist: this.playingTrack.artist,
                            title: this.playingTrack.title,
                            timers: this.playingTrack.timers,
                        }
                    );

                    // update instance
                    this.isSongScrobbled = true;
            }

        }, 6000);
    };
};

/* class handle player events */
class EventMonitor {

    constructor() {
        this.videoElem = document.querySelector("video")
    }

    // setup event listeners
    setupListeners() {
        this.videoElem.addEventListener("playing", this.handlePlayEvent);
        this.videoElem.addEventListener("pause", this.handlePauseEvent);
        this.videoElem.addEventListener("seeked", this.handleSeekingEvent);
    }

    // general testing
    handleGeneral(param) {
        console.log(param)
    }

    // handles track starts playing
    handlePlayEvent() {
        setTimeout(() => {
            playTracker.onPlay();
        }, 1000)
    }

    // handle track paused
    handlePauseEvent() {
        playTracker.onPause();
    }

    // handle track seeking
    handleSeekingEvent() {
        playTracker.onSeek();
    }
};

// connects to background script by sending msg
function lastFmConnector(requestObj, callback) {

    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);
};

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

// initialize script
function init() {
    lastFmConnector({type:'contentScript'},
    function(result) {
        if (result.msg) {
            window.playMonitor = new EventMonitor();
            window.playTracker = new Tracker(result);
            playMonitor.setupListeners();
        } else {
            console.log("not authorised")
        }
    })
};

// youtube music player closing
window.addEventListener('beforeunload', function (e) {
    lastFmConnector({type:"unloading"})
});

// wait for video element to be present in DOM before init
waitForElm("video")
.then(elem => {
    init();
})

// experimental
/* chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request)
        if (request.type === "updateTrackScrobbleAt") {
            playTracker.setVar("scrobbleAt", request.value)
        }
    }
) */