let lastfm = {};

const connectBtn = document.getElementById("connectBtn");
const songTitle = document.querySelector(".now-playing .song-title");
const songArtist = document.querySelector(".now-playing .song-artist");

connectBtn.onclick = async (e) => {

    console.log('auth token');
    // get token
    let [token, error] = await getLastFmToken();
    if (token === null) {
        return;
    };
    lastfm.token = token;

    // notify user of process
    document.querySelector(".messaging h4").innerHTML = "Please click ALLOW-ACCESS on pop up and CLOSE the window after"

    // open browser to auth token to user
    showAuthWindow({
        path: `http://www.last.fm/api/auth/?api_key=${lastfm.apiKey}&token=${token}`,
        callback: (token) => getLastFmSession(token)
    });
};


async function getLastFmToken() {
    // fetch token to be used
    try {
        let response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=${lastfm.apiKey}&format=json`);

        if (response.ok) {
            let _token = await response.json();
            storeToken(_token.token)
            return [_token['token'], null]

        } else {
            // api error most likely
            document.querySelector(".messaging h4").innerHTML = "Error, please contact developer"
            return [null, null]
        }

    } catch (error) {
        // handle server unreachable error
        document.querySelector(".messaging h4").innerHTML = "Could not reach lastfm, Please Try again later";
        return [null, error]
    }
};

async function getLastFmSession(token) {

    // use token and signature to get a session key
    let _token = token || lastfm.token
    if (!!!_token) {
        console.log("invalid token")
        document.querySelector(".messaging h4").innerHTML = "oops, something went wrong. Try restarting browser";
        return
    }
    let sign = getLastFmSignature('auth.getSession');

    try {
        let response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${lastfm.apiKey}&token=${_token}&api_sig=${sign}&format=json`);

        if (response.ok) {
            let _token = await response.json();
            storeSessionKey(_token.session);
        } else {
            // handle error
            document.querySelector(".messaging h4").innerHTML = "oops, something went wrong. Did you allow access before closing?. Try again";
        }

    } catch (error) {
        // handle error, ask user to try again
        document.querySelector(".messaging h4").innerHTML = "Could not reach lastfm, Please Try again later";
        console.log(error)
    }

};

function getLastFmSignature(method, token) {
    // md5 string
    let _token = token || lastfm.token // token
    let mdString = `api_key${lastfm.apiKey}method${method}token${_token}${lastfm.apiSecret}`

    // get signature
    let api_signature = md5(mdString);

    return api_signature;

};

function storeSessionKey({key, name, subscriber}) {

    // sets the session key and runs a callback function
    console.log(key, name, subscriber)
    chrome.storage.sync.set({
        'scrobblerLastFM': {key, name, subscriber}
    },
    function() {
        console.log(`${key} key has been stored`)
    }
    )
};

function storeToken(token, callback) {

    let _token = token;
    let _callback = callback || function() {
        console.log(`${_token} token has been stored`)
    }

    // store token
    chrome.storage.sync.set({
        'tokenLastFM': _token
    }, _callback)
};

function lastFmConnector(requestObj, callback) {
    // connects to background script by sending msg
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);

};

function showAuthWindow(options) {
    // change this to trigger on url change instead
    options.windowName = options.windowName ||  'ConnectScrobbler'; // should not include space for IE
    options.windowOptions = options.windowOptions || 'location=0,status=0,width=800,height=400';
    options.callback = options.callback || function(){ window.location.reload(); };
    var that = this;

    that._oauthWindow = window.open(options.path, options.windowName, options.windowOptions);
    that._oauthInterval = window.setInterval(function(){
        if (that._oauthWindow.closed) {
            window.clearInterval(that._oauthInterval);
            options.callback();
        }
        // cant access due to extension restriction
        /* if (that._oauthWindow.document.title.includes("authenticated")) {
            window.clearInterval(that._oauthInterval);
            console.log(
                "app auth"
            )
            options.callback();
            that.window.close();
        } */
    }, 1000);
};

function init() {
    // checks if session and token set
    lastFmConnector({type:'extensionScript'},
    function(result) {
        console.log(result)
        lastfm = {
            ...result
        };

        if (lastfm.session === null) {
            document.querySelector(".messaging h4").innerHTML = "Yet to authorize?/n"
            + "click connect button then ALLOW-ACCESS on pop up and CLOSE the window after"
        }

        if (lastfm.nowPlaying !== null) {
            songTitle.innerHTML = lastfm.nowPlaying.title
            songArtist.innerHTML = lastfm.nowPlaying.artist
        }
    });
}

init();