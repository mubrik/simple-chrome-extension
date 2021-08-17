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
        /* if (lastfm.isInstalled === undefined) {
            saveToStorageSync("isInstalled", true)
            saveToStorageSync("nowPlaying", null)
            saveToStorageSync("session", null)
            saveToStorageSync("token", null)
            saveToStorageSync("subscriber", null)
            saveToStorageSync("username", null)
            saveToStorageSync("scrobbleEnabled", true)
        } */
    }
)

function getLastFmSignedData(param) {

    // parameters
    let md5String = ""
    let _params = {
        api_key: lastfm.apiKey,
        sk: lastfm.session,
        ...param
    };
    
    // make string from sorted keys and value
    const sortedKeys = Object.keys(_params).sort();
    sortedKeys.forEach((item) => {
        // utf8 encoded params as lastfm requires it
        // utf8 encoder only works with strings
        if (item === "timestamp") {
            md5String += item + utf8.encode(String(_params[item]))
            return;
        }
        md5String += item + utf8.encode(_params[item])
    })
    md5String += lastfm.apiSecret;
    console.log(md5String)

    let _md5 = md5(md5String);

    // add signature and response format after
    _params["api_sig"] = _md5
    _params["format"] = "json"
    console.log(_md5, _params)
    return _params;

}

function getLastFmUnSignedData(param) {
    // parameters
    let _params = {
        api_key: lastfm.apiKey,
        format: "json",
        ...param
    };
    
    console.log(_params)
    return _params;
}

async function makeAuthenticatedReq (method, fmMethod, bodyData) {

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
        } else {
            // handle error, should implement retry after moving logic to bg script
            let result = await response.text();
            console.log(result);
        }

    } catch (error) {
        console.log(error);
    }
};

async function makeUnAuthenticatedReq(method, fmMethod, bodyData) {

    // parameters mostlikely get 
    let _method = method || "GET";
    let lastfmMethod = fmMethod;
    let _body = bodyData;

    // get unsigned datat
    let unSignedData = getLastFmUnSignedData({
        ..._body,
        method: lastfmMethod
    });

    // create urlencoded param for body 
    let data = new URLSearchParams(unSignedData)
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

function saveToStorageSync(idParam, storeParam, callback) {

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
    getAllStorageSyncData().then(items => {
        
        Object.assign(lastfm, items);
        console.log(lastfm)
    });
};

storeAllStorageSyncDataLocal();