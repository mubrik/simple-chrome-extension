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
    this.isVideo = this.isTrackVideo();
    this.isPaused = this.isTrackPaused();
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

  /** checks if the current song is a video
   * @return {Boolean}
  */
  isTrackVideo() {
    // check if details are correct
    if (this.details === null) {
      return false;
    }

    if (this.album.includes("views") &&
    this.year.includes("likes")) {
      return true;
    }
    return false;
  }

  /** checks if song paused
   * @return {Boolean}
  */
  isTrackPaused() {
    const pauseElem = document.querySelector(".play-pause-button");
    if (pauseElem.title === "Play") {
      return true;
    } else {
      return false;
    };
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

/** class handle player events */
class EventMonitor {
  /** class handle player events
   * @param {Boolean} init - if the player should log songs
   */
  constructor(init) {
    this.videoElem = document.querySelector("video");
    this.songMonitor = null;
    this.isSongPlaying = false;
    /* this.initiated = init || false; */
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
    // do something
  }

  /** check if to run*/
  /* handleInit() {
    lastFmConnector({type: "contentScript"}, function(result) {
      if (result.msg) {
        this.initiated = true;
      } else {
        this.initiated = false;
      }
    }.bind(this));
  } */

  /** handles track starts playing */
  handlePlayEvent() {
    // check if to progress
    /* if (!this.initiated) {
      this.handleInit();
      return;
    } */
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
    // update instance
    this.isSongPlaying = false;
  }

  /** handle track seeking */
  handleSeekingEvent() {
    // check if to progress
    /* if (!this.initiated) {
      this.handleInit();
      return;
    } */

    // get song
    const _nowPlaying = new Song();

    const [currentTime] = _nowPlaying.timers;

    // if track was seeked to < 10secs mark
    if (currentTime <= 10000) {
      // if loop tracker isnt started
      if (this.songMonitor === null) {
        this.loopTracker();
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
      // get song
      const _nowPlaying = new Song();

      // run only if song is playing
      if (_nowPlaying.isPaused) {
        return;
      }
      // check if details are not string return
      if (_nowPlaying.details === null || _nowPlaying.details === undefined) {
        return;
      };

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
  console.log("contet scrip msg", _req, _call);
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
  window.playMonitor = new EventMonitor(true);
  playMonitor.setupListeners();
  console.log("content script loaded");
}

// youtube music player closing
window.addEventListener("beforeunload", function(e) {
  lastFmConnector({type: "unloading"});
});

// wait for video element to be present in DOM before init
waitForElm("video").then((elem) => {
  init();
});
