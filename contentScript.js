/**
* class object holding song details 
*/
class Song {

    constructor() {
        this.title = this.getCurrentTrackTitle();
        this.artist = this.getCurrentTrackArtist();
        this.year = this.getCurrentTrackYear();
        this.album = this.getCurrentTrackAlbum();
        this.timers = this.getCurrentTrackTime();
    }

    /**@returns {String} */
    getCurrentTrackTitle() {
        let titleElement = document.querySelector('.middle-controls .title');
        return titleElement.innerText;
    };

    /**@returns {String} */
    getCurrentTrackArtist() {
        let artistElement = document.querySelector(".middle-controls .complex-string").children[0];
        return artistElement.innerText;
    };

    /**@returns {String} */
    getCurrentTrackAlbum() {
        // hit or miss on correct album
        let albumElement = document.querySelector(".middle-controls .complex-string").children[2];
        return albumElement.innerText;
    };

    /**@returns {String} */
    getCurrentTrackYear() {
        let yearElement = document.querySelector(".middle-controls .complex-string").children[4];
        return yearElement.innerText;
    };

    /**@returns {Array} */
    getCurrentTrackTime() {

        let timeElement = document.querySelector(".time-info").innerText.split("/")
        let currentTime = timeElement[0]
        let trackLength = timeElement[1]
    
        return [this.formatTimeValue(currentTime), this.formatTimeValue(trackLength)]
    };

    /** 
    * @returns {Number} return time in millisec
    * @param {String} string param
    */
    formatTimeValue(str) {
        // split time
        let timeArr = str.split(":")
    
        // convert to int and multiply to get millisec
        let minutes = parseInt(timeArr[0]) * 60000
        let seconds = parseInt(timeArr[1]) * 1000
    
        return minutes + seconds;
    }
}

/* class monitors play progress */
class Tracker {

    constructor() {
        this.playingTrack = null;
        this.songId = null;
        this.songMonitor = null;
        this.isSongPlaying = false;
        this.isSongScrobbled = false;
    }

    onPlay() {

        // get song
        let _nowPlaying = new Song();

        // get Id
        let _songId = this.getSongId(_nowPlaying);

        // check if same
        if (this.isSongTheSame(_songId)) {
            // do something

            // start interval checking, only if one doesnt exist already
            if (this.songMonitor === null) {
                this.trackSongChange();
            }

            // update instance
            this.isSongPlaying = true;

        } else {
            this.onSongChange(_nowPlaying);
        }
    };

    onPause() {

        console.log(this.songMonitor);

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
            if (currentTime <= 5000) {
                // call song change
                this.onSongChange(_nowPlaying);
            }
        }
    }

    onNext() {
        // trigger on song change
    };

    onPrevious() {
        // clear this.playingtrack so track can scrobble on replay
    };

    /** @param {Song} song */
    onSongChange(song) {
        // song changed update instance

        // store song
        this.playingTrack = song;

        // store new song Identfier
        this.songId = this.getSongId(this.playingTrack);

        // start interval checking, only if one doesnt exist already
        if (this.songMonitor === null) {
            this.trackSongChange();
        }

        // notify lastfm
        

        // update instance
        this.isSongPlaying = true;
        this.isSongScrobbled = false;
        
    }

    /** 
    * @param {string} param
    * @returns {boolean}
    */
    isSongTheSame(param) {
        return (param === this.songId);
    }

    /** 
    * @param {Song} song
    * @returns {Boolean}
    */
    isSongHalfway(song) {

        let [current, duration] = song.timers;
        let half = duration / 2;
        return (current >= half);
    }

    /** 
    * @param {Song} song
    * @returns {String}
    */
    getSongId(song) {
        return String(song["artist"]) + String(song["title"]);
    }

    trackSongChange() {

        this.songMonitor = setInterval(() => {

            if (!this.isSongPlaying) {
                console.log("song paused");
                return
            }

            let _songhalfway = false;
            let _songSame = false;

            // get song
            let _nowPlaying = new Song();

            // get playing song ID
            let _songId = this.getSongId(_nowPlaying);

            if (this.isSongTheSame(_songId) 
                && this.isSongScrobbled) {
                    console.log("song has been scrobbled")
                    return;
            }

            // check duration
            if (this.isSongHalfway(_nowPlaying)){
                console.log("song halfway")
                _songhalfway = true;

            } else {
                // do nothing or implement log current time
                console.log("song not halfway")
            }

            // check if song is the same
            if (this.isSongTheSame(_songId)) {
                console.log("song same")
                _songSame = true;

            } else {
                // song changed do something
                console.log("song changed")
                this.onSongChange(_nowPlaying);
            }

            // only scrobble if song is same and past halfway
            if (_songhalfway 
                && _songSame) {
                    // scrobble to lastfm

                    // cancel monitoring
                    this.isSongScrobbled = true;
                }

            
        }, 12000);
    }
}

const playTracker = new Tracker();

/* class handle player events */
class EventMonitor {

    constructor() {

        this.videoElem = document.querySelector(".html5-video-container").children[0];
        this.prevButton = document.querySelector(".left-controls-buttons .previous-button #icon");
        this.nextButton = document.querySelector(".left-controls-buttons .next-button #icon");
        this.setupListeners();
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
            console.log("notifying play instance")
            playTracker.onPlay();
        }, 1000)
    }

    // handle track paused
    handlePauseEvent() {
        console.log("notifying pause instance")
        playTracker.onPause();
    }

    // handle track seeking
    handleSeekingEvent() {
        console.log("notifying seek instance")
        playTracker.onSeek();
    }

    // handle previous button clicked
    handlePreviousEvent() {
        console.log("notifying prev instance")
        playTracker.onPrevious();
    }  

    // handle next button clicked
    handleNextEvent() {
        console.log("notifying next instance")
        playTracker.onNext();
    }
}

function lastFmConnector(requestObj, callback) {
    // connects to background script by sending msg
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);

};

// initialize script
function init() {
    lastFmConnector({type:'startScript'},
    function() {
        console.log("start script go");
        setTimeout(() => {
            console.log("start event listeners 2sec late");
            const monitor = new EventMonitor();
            monitor.setupListeners();
        }, 2000)
    })
}

init();