/* global lastfm:writable, lastfm:writable */
let lastfm = {};

const connectBtn = document.getElementById("connectBtn");
const loveBtn = document.querySelector(".loveBtn");
const messaging = document.querySelector(".messaging h4");
const userLinkBtn = document.querySelector("#userLink");
const userLinkDiv = document.querySelector("#linkDiv");
const unAuthMsg = document.querySelector(".unauthorized");
const nowPlaying = document.querySelector(".now-playing");
const songTitle = document.querySelector(".now-playing .song-title");
const songArtist = document.querySelector(".now-playing .song-artist");
const songLove = document.querySelector('.now-playing .song-loveBtn');
const songScrobbles = document.querySelector(".now-playing .song-scrobbles");
const scrobbleToggle = document.querySelector("#scrobble-toggle");
const scrobbleSelect = document.querySelector("#scrobble-length");
const errors = document.querySelector(".errors");
const errorElement = document.querySelector(".errors p");

/* experimental */
/* const testBtn = document.getElementById("testBtn"); */
/* const shareBtn = document.querySelector("#shareBtn"); */

/* shareBtn.onclick = (e) => {

    backgroundConnect({
        type:"getTrackInfo"
    });
}; */

/* testBtn.onclick = async (e) => {

    // get token
    let [token, error] = await getLastFmToken();
    if (token === null) {
        return;
    };
    lastfm.token = token;

    backgroundConnect({
        type: "newTab",
        url: `http://www.last.fm/api/auth/?api_key=${lastfm.apiKey}&token=${token}`
    })
} */

/* end */


connectBtn.onclick = async (e) => {
  // get token
  const [token] = await getLastFmToken();
  if (token === null) {
    return;
  };
  lastfm.token = token;

  // background script auth process
  backgroundConnect({
    type: "authUser",
    url: `http://www.last.fm/api/auth/?api_key=${lastfm.apiKey}&token=${token}`,
  });
};

userLinkBtn.onclick = async (e) => {
  // background script create tab
  backgroundConnect({
    type: "userProfile",
    url: `https://www.last.fm/user/${lastfm.username}`,
  });
};

loveBtn.onclick = (e) => {
  // set current is loved attribute
  backgroundConnect({type: "updateLove"},

    // callback to update html
    function(params) {
      if (params.status === "track.love") {
        loveBtn.src = "./images/love.svg";
      } else {
        loveBtn.src = "./images/love1.svg";
      }
    });
};

scrobbleToggle.onchange = (e) => {
  // update background setting
  backgroundConnect({
    type: "updateScrobbleSettings",
    value: e.target.checked,
  });
};

scrobbleSelect.onchange = (e) => {
  // update background setting
  backgroundConnect({
    type: "updateScrobbleAt",
    value: e.target.value,
  });
};
/** gets a lastfm token to be used for auth */
async function getLastFmToken() {
  // fetch token to be used
  try {
    const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=${lastfm.apiKey}&format=json`);

    if (response.ok) {
      const _token = await response.json();
      backgroundConnect({
        type: "saveToken",
        token: _token["token"],
      });

      return [_token["token"], null];
    } else {
      // api key invalid most likely
      document.querySelector(".messaging h4")
        .innerText = "Error, please contact developer";
      return [null, null];
    }
  } catch (error) {
    // handle server unreachable error
    document.querySelector(".messaging h4")
      .innerText = "Could not reach lastfm, Please Try again later";
    return [null, error];
  }
};

/** connects to background script by sending msg
 * @param {Object} requestObj
 * @param {Function} callback
 */
function backgroundConnect(requestObj, callback) {
  // connects to background script by sending msg
  const _req = requestObj;
  const _call = callback;

  chrome.runtime.sendMessage(_req, _call);
};

/** initialize script */
function init() {
  // checks if session and token set
  backgroundConnect({type: "extensionScript"},
    // callback
    function(result) {
      lastfm = {
        ...result,
      };

      // if user authorized token and session available
      if (lastfm.session === null) {
        unAuthMsg.classList.remove("hidden");
      } else {
        connectBtn.innerText = "LastFM Connected";
        connectBtn.style.backgroundColor = "aquamarine";
        nowPlaying.classList.remove("hidden");
      }

      // if a track is playing
      if (lastfm.nowPlaying.id !== null) {
        nowPlaying.classList.remove("hidden");
        songTitle.innerText = lastfm.nowPlaying.track;
        songArtist.innerText = lastfm.nowPlaying.artist;
        if (lastfm.nowPlaying.playCount !== null) {
          songScrobbles.innerText = `Scrobbles: ${lastfm.nowPlaying.playCount}`;
        }
        if (lastfm.nowPlaying.isLoved !== null) {
          songLove.classList.remove("hidden");
          loveBtn.src = lastfm.nowPlaying.isLoved ?
          "./images/love.svg" : "./images/love1.svg";
        }
      }
      // if username is present
      if (lastfm.username !== null) {
        messaging.innerText = `Welcome ${lastfm.username}`;
        userLinkDiv.classList.remove("hidden");
      }

      // scrobble options
      if (lastfm.scrobbleEnabled) {
        scrobbleToggle.checked = true;
        if (lastfm.scrobbleAt === "end") {
          scrobbleSelect.children[1].selected = true;
        }
      }
      // errors
      if (lastfm.errors !== null) {
        // do something, notify user
        errors.classList.remove("hidden");
        errorElement.innerText = lastfm.errors.message;
      }
    });
}

init();
