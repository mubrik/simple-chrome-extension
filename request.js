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
        md5String += item + _params[item]
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

async function makeAuthenticatedReq (method, fmMethod, bodyData) {

    // parameters
    let _method = method;
    let lastfmMethod = fmMethod;
    let _body = bodyData;

    let signedData = getLastFmSignedData({
        ..._body,
        method: lastfmMethod
    });

    console.log(signedData)
    let data = new URLSearchParams(signedData)

    let myReq = new Request("http://ws.audioscrobbler.com/2.0/", {
        method: _method,
        body: data
    })
    console.log(myReq)

    /* try {
        let response = await fetch(myReq)

        if (response.ok) {
            console.log(response);
            let result = await response.json();
            console.log(result);
        } else {
            // handle error
            console.log(response);
            let result = await response.text();
            console.log(result);
        }

    } catch (error) {
        console.log(error);
    } */
}

function getSessionKey(callback) {
    // set callback
    _callback = callback || function(result) {
        console.log(`${result.key} key has been added to lastfmObj`)
        if (result.key !== undefined) {
            lastfm.session = result.key;
        }
    }
    // gets the session key and runs a callback function
    chrome.storage.sync.get(['scrobblerLastFM'], ({scrobblerLastFM}) => _callback(scrobblerLastFM));
}

function getToken(callback) {

    let _callback = callback || function(result) {
        console.log(`${result.tokenLastFM} token has been added to lastfmObj`)
        if (result.tokenLastFM !== undefined) {
            lastfm.token = result.tokenLastFM;
        }
    }

    // get token
    chrome.storage.sync.get('tokenLastFM', _callback)
}

getSessionKey();
getToken();