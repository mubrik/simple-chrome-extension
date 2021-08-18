chrome.runtime.onInstalled.addListener(
    // run on first install or update
    function (param) {

        // check storage for already set valid variable
        storeAllStorageSyncDataLocal()

        // set variables to be used as null if not set/valid or hasnt been installed
        if (lastfm.isInstalled === undefined) {
            chrome.storage.sync.set({
                "isInstalled": true,
                "nowPlaying": null,
                "session": null,
                "token": null,
                "subscriber": null,
                "username": null,
                "scrobbleEnabled": true
            })
        };
    }
)

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

function storeAllStorageSyncDataLocal() {

    // Copy the data retrieved from storage into storageCache.
    getAllStorageSyncData()
    .then(items => {
        Object.assign(lastfm, items);
        console.log(lastfm)
    });
};

function saveToStorageSync(idParam, storeParam, callback) {
    // stores item to sync storage
    // callback to storage cache

    let _storeId = String(idParam)
    let _storeItem = storeParam
    let _callback = callback || function() {
        // after every storage update, call this to update instance storageCache
        storeAllStorageSyncDataLocal();
    }

    // store item
    chrome.storage.sync.set({
        [_storeId]: _storeItem
    }, _callback)
};

function getLastFmSignedData(param) {
    // for making signed lastfm calls
    // creates md5 signature from given object
    // insert a api_sig sey and format=json for lastfm response

    // parameters
    let md5String = ""
    let _params = {
        ...param
    };
    
    // make string from sorted keys and value as per lastfm requirement
    const sortedKeys = Object.keys(_params).sort();
    sortedKeys.forEach((item) => {
        // utf8 encoded params as lastfm requires it
        // utf8 encoder only works with strings, change timestamp (or all?) to string
        if (item === "timestamp") {
            md5String += item + utf8.encode(String(_params[item]))
            return;
        }
        md5String += item + utf8.encode(_params[item])
    })

    // secret should always be last, lastfm requirement
    md5String += lastfm.apiSecret;
    // get md5
    let _md5 = md5(md5String);

    // add signature and response format after
    _params["api_sig"] = _md5
    _params["format"] = "json"
    console.log(md5String, _params)
    return _params;

}

async function makeAuthenticatedReq (method, fmMethod, bodyData) {
    // makes authenticated/signed call request to lastfm

    // parameters
    let _method = method;
    let lastfmMethod = fmMethod;
    let _body = bodyData;

    // get signed datat
    let signedData = getLastFmSignedData({
        ..._body,
        method: lastfmMethod
    });
    // create urlencoded param for body 
    let data = new URLSearchParams(signedData)
    console.log(data.toString())

    // make request
    let myReq = new Request("http://ws.audioscrobbler.com/2.0/", {
        method: _method,
        body: data
    })

    try {
        let response = await fetch(myReq)

        if (response.ok) {
            let result = await response.json();
            console.log(result);
            return {
                ok: true,
                response: result
            }
        } else {
            // handle error, should implement retry after moving logic to bg script
            let result = await response.text();
            console.log(result);
            return {
                ok: false,
                response: result
            }
        }

    } catch (error) {
        console.log(error);
    }
};

async function makeUnAuthenticatedReq(method, bodyData) {

    // makes GET or unauth calls to lastfm 

    // parameters mostlikely get 
    let _method = method || "GET";
    let _body = bodyData;

    // create urlencoded param for body 
    let data = new URLSearchParams(_body)
    console.log(data.toString())

    // fetch request
    try {
        let response = await fetch(`http://ws.audioscrobbler.com/2.0/?` + data.toString(), {
            method: _method
        })

        if (response.ok) {
            let result = await response.json();
            return result;
        } else {
            // handle error, should implement retry after moving logic to bg script
            let result = await response.text();
            return result;
        }

    } catch (error) {
        console.log(error);
    }
};

function lastfmListener(tabId, changeInfo, tab) {

    // listener for user authorization
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
                          url: window.document.location.href
                      }
                  }
                },
                (injectionResults) => {
                    // send return value to process
                    for (const frameResult of injectionResults)
                        processUserAuth(frameResult);
                }
            )

        }
        /* Now, let's relieve ourselves from our listener duties */
        /* chrome.tabs.onUpdated.removeListener(myListener); */
        return;
    }
};

async function processUserAuth({result}) {

    console.log(result);

    if (result.title.includes("Application authenticated")
    && result.url.includes(lastfm.apiKey)) {

        // if user authenticated our token, get a session key
        // data to be used
        let bodyData = {
            method: "auth.getSession",
            api_key: lastfm.apiKey,
            token: lastfm.token
        }

        // lastfm method requires signature
        let signedData = getLastFmSignedData(bodyData);

        // get the session key
        let sessionObj = await makeUnAuthenticatedReq("GET", signedData);

        // error check
        if (sessionObj) {

            // store the session keys in sync storage
            chrome.storage.sync.set({
                "session": sessionObj.session["key"],
                "username": sessionObj.session["name"],
                "subscriber": sessionObj.session["subscriber"]
            })
            // store in cache storage
            storeAllStorageSyncDataLocal();

            // remove listener
            chrome.tabs.onUpdated.removeListener(lastfmListener);
        }

    }

    else if (result.title.includes("onnect application")
    && result.url.includes(lastfm.apiKey)) {
        // do something
    }

};

function scrobbleTrackToLastFm(song) {
    // experimental, prepares scrobble data and makes request
    // get current time in ms
    let utcTime = Date.now()
    // subtrack elapsed track time
    let timestamp = utcTime - song.timers[0];
    // convert to seconds
    let timestampSec = Math.floor(timestamp / 1000);
    // lastfm request body data
    let bodyData = {
        timestamp:timestampSec,
        artist: song.artist,
        track: song.title,
        api_key: lastfm.apiKey,
        sk: lastfm.session
    }
    // make auth call
    if (lastfm.scrobbleEnabled) {
        makeAuthenticatedReq("POST", "track.scrobble", bodyData)
        .then(result => {
            if (result.ok) {
                // store in sync storage
                saveToStorageSync("nowPlaying",
                {
                    
                    playCount: userPlayCount,
                    isLoved: userLoved,
                    isScrobbled: true
                }
                )
            }
        })
    }
}

function updateTrackLastFM(song) {
    // experimental, prepares track nowplaying data and makes request

    // lastfm request body data
    let bodyData = {
        artist: song.artist,
        track: song.title,
        api_key: lastfm.apiKey,
        sk: lastfm.session
    }
    // make auth call
    makeAuthenticatedReq("POST", "track.updateNowPlaying", bodyData);
}

function updateTrackLocal(song) {
    // experimental, gets track data and makes request

    // set some vars
    let userPlayCount = null;
    let userLoved = false

    // get song details related to user from lastfm
    makeUnAuthenticatedReq("GET", 
    {
        artist: song.artist,
        track: song.title,
        api_key: lastfm.apiKey,
        username: lastfm.username,
        method: "track.getInfo",
        format: "json"
    })
    .then(result => {

        if (result.track) {
            userPlayCount = result.track.userplaycount;
            userLoved = result.track.userloved === "0" ? false : true;
        }

        // store in sync storage
        saveToStorageSync("nowPlaying",
            {
                ...song,
                playCount: userPlayCount,
                isLoved: userLoved,
                isScrobbled: false
            }
        )
    })
}

function isSongAtScrobbleTime(song) {
    // get timers from obj
    let [current, duration] = song.timers;

        if (duration <= 30000) {
            // if track is less than 30s, false so never scrobbles
            return false;
        }

        if (lastfm.scrobbleAt === "end") {
            // get 90% duration of track
            let timer = duration * 0.9;
            return (current >= timer);
        }

        let timer = duration / 2;
        return (current >= timer);
}

// call this on every run to fetch sync storage to storagecache
storeAllStorageSyncDataLocal();