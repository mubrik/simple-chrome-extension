/**
* class object holding song details 
*/
class Song {

    constructor() {
        this.title = this.getCurrentTrackTitle();
        this.details = this.getTrackDetails();
        this.artist = this.details[0]
        this.album = this.details[1]
        this.year = this.details[2].replace(/\s+/g, '');
        this.timers = this.getCurrentTrackTime();
    }

    /**@returns {String} */
    getCurrentTrackTitle() {
        let titleElement = document.querySelector('yt-formatted-string.title.ytmusic-player-bar');
        return titleElement.innerText;
    };

    /**@returns {Array} */
    getTrackDetails() {
        console.log(document.querySelector('yt-formatted-string.byline.ytmusic-player-bar'))
        let detailList = document.querySelector('yt-formatted-string.byline.ytmusic-player-bar').textContent.split("•");
        return detailList;
    };

    getTrackArtist() {
        
    }

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

    removeEmojis (string) {
        const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
        return string.replace(regex, '');
    }
};

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
        console.log(_nowPlaying)

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

        // update instance
        this.isSongPlaying = true;
        this.isSongScrobbled = false;

        // notify lastfm

        // notify local store
        lastFmConnector(
            {
                type: "updateLocalNowPLaying",
                artist: this.playingTrack.artist,
                title: this.playingTrack.title
            }
        )
        
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
};

/* class handle player events */
class EventMonitor {

    constructor() {

        this.videoElem = document.querySelector(".html5-video-container").children[0];
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
};

function lastFmConnector(requestObj, callback) {

    // connects to background script by sending msg
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);

};

const playTracker = new Tracker();

// initialize script
function init() {
    lastFmConnector({type:'contentScript'},
    function(result) {
        if (result.msg) {
            console.log("start script go");
            setTimeout(() => {
                console.log("start event listeners 2sec late");
                const monitor = new EventMonitor();
                monitor.setupListeners();
            }, 2000)
        } else {
            console.log("not authorised")
        }
    })
};

document.onreadystatechange = function() {
    if (document.readyState === 'complete') {
        init();
    }
};