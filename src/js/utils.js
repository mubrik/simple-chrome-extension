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
            return result;
        } else {
            // handle error, should implement retry after moving logic to bg script
            let result = await response.text();
            console.log(result);
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
}


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
}

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

}

// call this on every run to fetch sync storage to storagecache
storeAllStorageSyncDataLocal();