// call this on every run to fetch sync storage to storagecache
storeAllStorageSyncDataLocal();

chrome.runtime.onInstalled.addListener(
  // run on first install or update
  function(param) {
    // set variables to be used as null if not set/valid or hasnt been installed
    if (lastfm.isScrobblerInstalled === undefined ) {
      // set variables
      chrome.storage.sync.set({
        "isScrobblerInstalled": true,
        "session": null,
        "token": null,
        "username": null,
        "nowPlaying": {
          id: null,
          isScrobbled: false,
          isPlayingOnLastfm: false,
        },
        "scrobbleEnabled": true,
        "scrobbleAt": "half",
        "errors": null,
      });
      // store variables in storagecache
      storeAllStorageSyncDataLocal();
    };
  },
);
/** gets all sync storage data
 * @return {Promise}
 */
function getAllStorageSyncData() {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(null, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items);
    });
  });
};

/** stores all sync storage data to local lastfm cache */
function storeAllStorageSyncDataLocal() {
  // Copy the data retrieved from storage into storageCache.
  getAllStorageSyncData()
    .then((items) => {
      Object.assign(lastfm, items);
    });
};

/** saves a an item to storage sync and
 * calls storeAllStorageSyncDataLocal to update storagecache
 * @param {String} idParam - key to store
 * @param {Object} storeParam - value to store
 * @param {Function} callback - callback
 */
function saveToStorageSync(idParam, storeParam, callback) {
  // stores item to sync storage
  // callback to storage cache

  const _storeId = String(idParam);
  const _storeItem = storeParam;
  const _callback = callback || function() {
    // after every storage update, call this to update instance storageCache
    storeAllStorageSyncDataLocal();
  };

  // store item
  chrome.storage.sync.set({
    [_storeId]: _storeItem,
  }, _callback);
};

/**
  for making signed lastfm callscreates md5 signature from given object
  insert a api_sig sey and format=json for lastfm response
    @param {Object} param - request parameters
    @return {Object}
*/
function getLastFmSignedData(param) {
  // parameters
  let md5String = "";
  const _params = {
    ...param,
  };

  // make string from sorted keys and value as per lastfm requirement
  const sortedKeys = Object.keys(_params).sort();
  sortedKeys.forEach((item) => {
    // utf8 encoded params as lastfm requires it
    // utf8 encoder only works with strings,
    // change timestamp (or all?) to string
    if (item === "timestamp") {
      md5String += item + utf8.encode(String(_params[item]));
      return;
    }
    md5String += item + utf8.encode(_params[item]);
  });

  // secret should always be last, lastfm requirement
  md5String += lastfm.apiSecret;
  // get md5
  const _md5 = md5(md5String);

  // add signature and response format after
  _params["api_sig"] = _md5;
  _params["format"] = "json";
  return _params;
}

/**
  makes authenticated/signed call request to lastfm
    @param {String} method - request method
    @param {String} fmMethod - lastfm method
    @param {Object} bodyData - request body object
    @return {Object}
*/
async function makeAuthenticatedReq(method, fmMethod, bodyData) {
  // parameters
  const _method = method;
  const lastfmMethod = fmMethod;
  const _body = bodyData;

  // get signed datat
  const signedData = getLastFmSignedData({
    ..._body,
    method: lastfmMethod,
  });
    // create urlencoded param for body
  const data = new URLSearchParams(signedData);

  // make request
  const myReq = new Request("http://ws.audioscrobbler.com/2.0/", {
    method: _method,
    body: data,
  });

  try {
    const response = await fetch(myReq);

    if (response.ok) {
      const result = await response.json();
      return {
        ok: true,
        response: result,
      };
    } else {
      // handle error, should implement retry logic
      const result = await response.text();
      return {
        ok: false,
        response: result,
      };
    }
  } catch (error) {
    // net disconnect, fail gracefully
    return {
      ok: false,
      response: error,
    };
  }
};

/**
 *  makes GET or unauth calls to lastfm
 *  @param {String} method - request method
    @param {Object} bodyData - request body object
 */
async function makeUnAuthenticatedReq(method, bodyData) {
  // parameters mostlikely get
  const _method = method || "GET";
  const _body = bodyData;

  // create urlencoded param for body
  const data = new URLSearchParams(_body);

  // fetch request
  try {
    const response = await fetch("http://ws.audioscrobbler.com/2.0/?" + data.toString(), {
      method: _method,
    });

    if (response.ok) {
      const result = await response.json();
      return {
        ok: true,
        response: result,
      };
    } else {
      // handle error, should implement retry after moving logic to bg script
      const result = await response.text();
      return {
        ok: false,
        response: result,
      };
    }
  } catch (error) {
    // unreachable, fail gracefully do something
    return {
      ok: false,
      response: error,
    };
  }
};

/**
 * listener for user authorization, injects script in page
 *  @param {Number} tabId - the tab id
    @param {Object} changeInfo - the status changes
    @param {Object} tab - the tab object
 */
function lastfmListener(tabId, changeInfo, tab) {
  if (tab.url.match("last.fm/api/auth?")) {
    // match if user navigates to auth page

    if (changeInfo.status === "complete") {
      // insert script after loading complete to prevent dupes
      chrome.scripting.executeScript(
        {
          target: {tabId: tab.id},
          function: function() {
            // return the title and url of auth page
            return {
              title: window.document.title,
              url: window.document.location.href,
            };
          },
        },
        (injectionResults) => {
          // send return value to process
          for (const frameResult of injectionResults) {
            processUserAuth(frameResult);
          }
        },
      );
    }
    /* chrome.tabs.onUpdated.removeListener(myListener); */
    return;
  }
};

/**
 *works on data received from script injected into last.fm/api/auth? by listener
 *  @param {Object} result - the tab id
 */
async function processUserAuth({result}) {
  if (result.title.includes("Application authenticated") &&
    result.url.includes(lastfm.apiKey)) {
    // if user authenticated our token, get a session key

    // data to be used
    const bodyData = {
      method: "auth.getSession",
      api_key: lastfm.apiKey,
      token: lastfm.token,
    };

    // lastfm method requires signature
    const signedData = getLastFmSignedData(bodyData);

    // get the session key
    const response = await makeUnAuthenticatedReq("GET", signedData);

    // error check
    if (response.ok) {
      const {session} = response.response;
      // store the session keys in sync storage
      chrome.storage.sync.set({
        "session": session["key"],
        "username": session["name"],
        "subscriber": session["subscriber"],
      });
      // store in cache storage
      storeAllStorageSyncDataLocal();

      // remove listener
      chrome.tabs.onUpdated.removeListener(lastfmListener);
    }
  } else if (result.title.includes("onnect application") &&
    result.url.includes(lastfm.apiKey)) {
    // do something
  }
};

/**
 *prepares scrobble data and makes request to lastfm to scrobble track
 *  @param {Object} song - the Song instance
 */
function scrobbleTrackToLastFm(song) {
  // get current time in ms
  const utcTime = Date.now();
  // subtrack elapsed track time
  const timestamp = utcTime - song.timers[0];
  // convert to seconds
  const timestampSec = Math.floor(timestamp / 1000);
  // lastfm request body data
  const bodyData = {
    timestamp: timestampSec,
    artist: song.artist,
    track: song.track,
    api_key: lastfm.apiKey,
    sk: lastfm.session,
  };
  // make auth call
  if (lastfm.scrobbleEnabled) {
    makeAuthenticatedReq("POST", "track.scrobble", bodyData)
      .then((result) => {
        // update storage scrobble status
        if (result.ok) {
          // store in sync storage
          saveToStorageSync("nowPlaying",
            {
              ...lastfm.nowPlaying,
              timers: song.timers,
              isScrobbled: true,
            },
          );
        }
      });
  }
}

/**
 *prepares track nowplaying data and makes request to update lastfm nowplaying
 *  @param {Object} song - the Song instance
 */
function updateTrackLastFM(song) {
  // lastfm request body data
  const bodyData = {
    artist: song.artist,
    track: song.track,
    api_key: lastfm.apiKey,
    sk: lastfm.session,
  };
  // make auth call
  makeAuthenticatedReq("POST", "track.updateNowPlaying", bodyData)
    .then((result) => {
      if (result.ok) {
        // store in sync storage
        saveToStorageSync("nowPlaying",
          {
            ...lastfm.nowPlaying,
            timers: song.timers,
            isPlayingOnLastfm: true,
          },
        );
      }
    });
};

/**
 *gets user track data from last fm, saves to nowplaying
 *  @param {Object} song - the Song instance
 */
function updateTrackLocal(song) {
  // set some vars
  let userPlayCount = null;
  let userLoved = false;
  // body data
  const bodyData = {
    artist: song.artist,
    track: song.track,
    api_key: lastfm.apiKey,
    username: lastfm.username,
    method: "track.getInfo",
    format: "json",
  };
  // get song details related to user from lastfm
  makeUnAuthenticatedReq("GET", bodyData)
    .then((result) => {
      try {
        if (result.ok) {
          // if get req successful update vars
          const {track} = result.response;
          // req can be successful but lastfm doesnt know the song
          if (track) {
            userPlayCount = track.userplaycount;
            userLoved = track.userloved === "0" ? false : true;
          };
        }
      } catch (error) {
        // skip error, requset failed
      } finally {
        // if error occurs still, store in sync storage
        saveToStorageSync("nowPlaying",
          {
            ...song,
            playCount: userPlayCount,
            isLoved: userLoved,
            isScrobbled: false,
            isPlayingOnLastfm: false,
          },
        );
      }
    });
};

/**
 *check if current song has reached time to scrobble
 *  @param {Object} song - the Song instance
 *  @return {Boolean}
 */
function isSongAtScrobbleTime(song) {
  // get timers from obj
  const [current, duration] = song.timers;

  if (duration <= 30000) {
    // if track is less than 30s, false so never scrobbles
    return false;
  }

  if (lastfm.scrobbleAt === "end") {
    // get 90% duration of track
    const timer = duration * 0.9;
    return (current >= timer);
  }

  const timer = duration / 2;
  return (current >= timer);
}
