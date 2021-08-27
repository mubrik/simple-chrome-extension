/**
 * class object holding song details
 */
class Song {
/**
 * class object holding song details
 */
  constructor() {
    this.title = this.getCurrentTrackTitle();
    this.details = this.getTrackDetails();
    this.artist = this.details ? this.details[0].trim() : null;
    this.album = this.details ? this.details[1].trim() : null;
    this.year = this.details ? this.details[2].trim() : null;
    this.id = this.getTrackId();
    this.timers = this.getCurrentTrackTime();
  }

  /** gets track title from player bar
     * @return {String}
     * */
  getCurrentTrackTitle() {
    const titleElement = document.querySelector(
      "yt-formatted-string.title.ytmusic-player-bar",
    );
    return titleElement.innerText;
  }

  /** gets track other details from player bar
     * @return {Array}
     * */
  getTrackDetails() {
    const trackDetailsElem = document.querySelector(
      "yt-formatted-string.byline.ytmusic-player-bar",
    );
    const detailsList = trackDetailsElem ?
      trackDetailsElem.textContent.split("•") :
      null;
    return detailsList;
  }

  /** gets track id
     * @return {String}
     * */
  getTrackId() {
    const id = String(this.title + this.artist).replace(/\s/g, "");
    return id;
  }

  // /**@returns {String} */
  // getCurrentTrackArtist() {
  // let artistElement = document
  // .querySelector(".middle-controls .complex-string").children[0];
  //     return artistElement.innerText;
  // };

  // /**@returns {String} */
  // getCurrentTrackAlbum() {
  //     // hit or miss on correct album
  // let albumElement = document
  // .querySelector(".middle-controls .complex-string").children[2];
  //     return albumElement.innerText;
  // };

  // /**@returns {String} */
  // getCurrentTrackYear() {
  // let yearElement = document
  //  .querySelector(".middle-controls .complex-string").children[4];
  //     return yearElement.innerText;
  // };

  /** @return {Array} */
  getCurrentTrackTime() {
    const timeEmt = document.querySelector(".time-info").innerText.split("/");
    const currentTime = timeEmt[0];
    const trackLength = timeEmt[1];

    return [
      this.formatTimeValue(currentTime),
      this.formatTimeValue(trackLength),
    ];
  }

  /**
    * @return {Number} return time in millisec
    * @param {String} str param
    */
  formatTimeValue(str) {
    // split time
    const timeArr = str.split(":");

    if (timeArr.length === 3) {
      // time is in hours

      // convert to int and multiply to get millisec
      const hours = parseInt(timeArr[0]) * 3600000;
      const minutes = parseInt(timeArr[1]) * 60000;
      const seconds = parseInt(timeArr[2]) * 1000;

      return hours + minutes + seconds;
    }

    // convert to int and multiply to get millisec
    const minutes = parseInt(timeArr[0]) * 60000;
    const seconds = parseInt(timeArr[1]) * 1000;

    return minutes + seconds;
  }
  /**
   * some track titles from YTmusic have emojis
   * could come in handy
   * @param {String} param string to format
   * @return {String}
   * */
  removeEmojis(param) {
    // complete later
    const regex = "regex";
    return string.replace(regex, "");
  }
}

/* class monitors play progress */
// class Tracker {

//     constructor(param) {
//         this.playingTrack = null;
//         this.songId = null;
//         this.songMonitor = null;
//         this.isSongPlaying = false;
//         this.isSongScrobbled = false;
//         this.scrobbleAt = param.scrobbleAt || "half";
//     };

//     setVar(param, value) {
//         // updates instance
//         this[param] = value
//     }

//     onPlay() {
//         // if loop tracker isnt started
//         if (this.songMonitor === null) {
//             this.loopRewrite();
//         }
//         // update instance
//         this.isSongPlaying = true;
//     };

//     onPause() {

//         // update instance
//         this.isSongPlaying = false;
//     };

//     onSeek() {
//         // seeking bar used, also applies if previous clicked
//         // check if time has been reset to < 00:05

//         // get song
//         let _nowPlaying = new Song();

//         // get Id
//         // let _songId = this.getSongId(_nowPlaying);

//         let [currentTime, _] = _nowPlaying.timers;

//         // if track was seeked to < 10secs mark
//         if (currentTime <= 10000) {

//             // if loop tracker isnt started
//             if (this.songMonitor === null) {
//                 this.loopRewrite();
//             }

//             // notify background script
//             lastFmConnector({
//                 type: "trackSeek"
//             })

//             // update instance
//             // this.isSongScrobbled = false;

//         }
//     };

//     /**
//     * @param {string} param
//     * @returns {boolean}
//     */
//     isSongTheSame(param) {
//         return (param === this.songId);
//     };

//     /**
//     * @param {Song} song
//     * @returns {Boolean}
//     */
//     isSongHalfway(song) {

//         let [current, duration] = song.timers;

//         if (duration <= 30000) {
//             // if track is less than 30s, false so never scrobbles
//             return false;
//         }

//         if (this.scrobbleAt === "end") {
//             console.log("scrobbling at end")
//             // get 90% duration of track
//             let timer = duration * 0.9;
//             return (current >= timer);
//         }

//         let timer = duration / 2;
//         return (current >= timer);
//     };

//     /**
//     * @param {Song} song
//     * @returns {String}
//     */
//     getSongId(song) {
//         return String(song["artist"]) + String(song["title"]);
//     };

//     /* main event loop tracker logic,
//     performs multiple instance checks,
//     if song is the same, or scrobbled
//     if song is halway
//     started by callback to background script
//     */
//     loopRewrite() {

//         this.songMonitor = setInterval(() => {

//             // run only if playing
//             if (!this.isSongPlaying) {
//                 return;
//             }

//             // get song
//             let _nowPlaying = new Song();

//             // check if details are not null return if not
//             if (typeof _nowPlaying.artist !== "string" &&
//                 typeof _nowPlaying.title !== "string" ) {
//                 return;
//             };

//             // get playing song ID
//             let _songId = this.getSongId(_nowPlaying);

//             // send to background
//             lastFmConnector({
//                 type: "playingSong",
//                 ..._nowPlaying,
//                 id: _songId,
//             })
//         }, 6000);
//     }

//     loopTracker() {

//         this.songMonitor = setInterval(() => {

//             // run only if playing
//             if (!this.isSongPlaying) {
//                 return;
//             }

//             let _songhalfway = false;
//             let _songSame = false;

//             // get song
//             let _nowPlaying = new Song();

//             // check if details are not null return if not
//             if (typeof _nowPlaying.artist !== "string" &&
//                 typeof _nowPlaying.title !== "string" ) {
//                 return;
//             };

//             // get playing song ID
//             let _songId = this.getSongId(_nowPlaying);

//             // is song same?
//             if (this.isSongTheSame(_songId)) {

//                 // if scrobbled
//                 if (this.isSongScrobbled) {
//                     console.log("song scrobbled")
//                     return;
//                 }

//                 _songSame = true;

//             } else {
//                 // song is new
//                 // store song
//                 console.log("new song")
//                 this.playingTrack = _nowPlaying;

//                 // store id
//                 this.songId = this.getSongId(_nowPlaying);

//                 // clear scrobble
//                 this.isSongScrobbled = false;

//                 // notify lastfm
//                 lastFmConnector(
//                     {
//                         type: "updateLocalNowPLaying",
//                         artist: this.playingTrack.artist,
//                         title: this.playingTrack.title
//                     }
//                 );
//             }

//             // check duration
//             if (this.isSongHalfway(_nowPlaying)){
//                 _songhalfway = true;

//             }

//             // only scrobble if song is same and past halfway
//             if (_songhalfway
//                 && _songSame) {
//                     // scrobble to lastfm
//                     lastFmConnector(
//                         {
//                             type: "scrobble",
//                             artist: this.playingTrack.artist,
//                             title: this.playingTrack.title,
//                             timers: this.playingTrack.timers,
//                         }
//                     );

//                     // update instance
//                     this.isSongScrobbled = true;
//             }

//         }, 6000);
//     };
// };

/** class handle player events */
class EventMonitor {
  /** class handle player events */
  constructor() {
    this.videoElem = document.querySelector("video");
    this.songMonitor = null;
    this.isSongPlaying = false;
  }

  /** setup event listeners */
  setupListeners() {
    this.videoElem.addEventListener("playing", this.handlePlayEvent.bind(this));
    this.videoElem.addEventListener("pause", this.handlePauseEvent.bind(this));
    this.videoElem.addEventListener("stalled", this.handleGeneral.bind(this));
    this.videoElem.addEventListener(
      "seeked",
      this.handleSeekingEvent.bind(this),
    );
  }

  /** general testing
   * @param {Event} param
   */
  handleGeneral(param) {
    console.log("stalled");
    console.log(param);
  }

  /** handles track starts playing */
  handlePlayEvent() {
    // check if there's no loop tracker running
    if (this.songMonitor === null) {
      // start loop
      this.loopTracker();
    }
    // update instance
    this.isSongPlaying = true;
  }

  /** handle track paused */
  handlePauseEvent() {
    /* playTracker.onPause(); */

    // update instance
    this.isSongPlaying = false;
  }

  /** handle track seeking */
  handleSeekingEvent() {
    // playTracker.onSeek();

    // get song
    const _nowPlaying = new Song();

    const [currentTime] = _nowPlaying.timers;

    // if track was seeked to < 10secs mark
    if (currentTime <= 10000) {
      // if loop tracker isnt started
      if (this.songMonitor === null) {
        this.loopRewrite();
      }

      // notify background script
      lastFmConnector({
        type: "trackSeek",
      });
    }
  }

  /** main instance, loop tracker */
  loopTracker() {
    // start loop interval and save ID
    this.songMonitor = setInterval(() => {
      // run only if song is playing
      if (!this.isSongPlaying) {
        return;
      }

      // get song
      const _nowPlaying = new Song();

      // check if details are not null return if null
      if (
        typeof _nowPlaying.artist !== "string" &&
                typeof _nowPlaying.title !== "string"
      ) {
        return;
      }

      // get playing song ID
      //   const _songId = this.getSongId(_nowPlaying);

      // send to background
      lastFmConnector({
        type: "playingSong",
        ..._nowPlaying,
      });
    }, 10000);
  }

  /**
     * @param {Song} song
     * @return {String}
     */
  getSongId(song) {
    return String(song["artist"]) + String(song["title"]);
  }
}

/** connects to background script by sending msg
 * @param {Object} requestObj
 * @param {Function} callback
 */
function lastFmConnector(requestObj, callback) {
  const _req = requestObj;
  const _call = callback;

  chrome.runtime.sendMessage(_req, _call);
}

/** connects to background script by sending msg
 * @param {String} selector query selector
 * @return {Promise}
 */
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
/** initialize script */
function init() {
  lastFmConnector({type: "contentScript"}, function(result) {
    if (result.msg) {
      window.playMonitor = new EventMonitor();
      playMonitor.setupListeners();
    } else {
      console.log("not authorised");
    }
  });
}

// youtube music player closing
window.addEventListener("beforeunload", function(e) {
  lastFmConnector({type: "unloading"});
});

// wait for video element to be present in DOM before init
waitForElm("video").then((elem) => {
  init();
});

// experimental
/* chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request)
        if (request.type === "updateTrackScrobbleAt") {
            playTracker.setVar("scrobbleAt", request.value)
        }
    }
) */
