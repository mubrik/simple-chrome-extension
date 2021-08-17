let lastfm = {};

const connectBtn = document.getElementById("connectBtn");
const testBtn = document.getElementById("testBtn");
const loveBtn = document.querySelector(".loveBtn");
const messaging = document.querySelector(".messaging");
const unAuthMsg = document.querySelector(".unauthorized");
const nowPlaying = document.querySelector(".now-playing");
const songTitle = document.querySelector(".now-playing .song-title");
const songArtist = document.querySelector(".now-playing .song-artist");
const songScrobbles = document.querySelector(".now-playing .song-scrobbles");
const scrobbleToggle = document.querySelector("#scrobble-toggle");
const scrobbleSelect = document.querySelector("#scrobble-length");
/* const shareBtn = document.querySelector("#shareBtn"); */

connectBtn.onclick = async (e) => {

    // get token
    let [token, error] = await getLastFmToken();
    if (token === null) {
        return;
    };
    lastfm.token = token;

    // open browser to auth token to user
    showAuthWindow({
        path: `http://www.last.fm/api/auth/?api_key=${lastfm.apiKey}&token=${token}`,
        callback: (token) => getLastFmSession(token)
    });
};

loveBtn.onclick = (e) => {
    // set current is loved attribute
    backgroundConnect({type:"updateLove"},

    // callback to update html
    function (params) {
        if (params.status === "track.love") {
            loveBtn.src = "./src/images/love.svg";
        } else {
            loveBtn.src = "./src/images/love1.svg";
        }
    });
};

scrobbleToggle.onchange = (e) => {
    // update background setting
    backgroundConnect({
        type:"updateScrobbleSettings",
        value: e.target.checked,
    });
};

scrobbleSelect.onchange = (e) => {
    backgroundConnect({
        type:"updateScrobbleAt",
        value: e.target.value
    });
    console.log(e.target.value)
};

/* shareBtn.onclick = (e) => {

    backgroundConnect({
        type:"getTrackInfo"
    });
}; */

/* testBtn.onclick = async (e) => {

    backgroundConnect({type: "newTab"})
    chrome.tabs.create({
        active: false,
        url: "http://www.google.com"
    }).then((tab) => {
        console.log(tab)

        chrome.scripting.executeScript(
            {
              target: {tabId: tab.id},
              function: authTab,
            },
            (injectionResults) => {
                console.log(injectionResults);
            });
    })
} */

async function getLastFmToken() {
    // fetch token to be used
    try {
        let response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=${lastfm.apiKey}&format=json`);

        if (response.ok) {
            let _token = await response.json();
            backgroundConnect({
                type: "saveToken",
                token: _token['token']
            })

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
        document.querySelector(".messaging h4").innerHTML = "oops, something went wrong. Try restarting browser";
        return
    }
    let sign = getLastFmSignature('auth.getSession');

    try {
        let response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${lastfm.apiKey}&token=${_token}&api_sig=${sign}&format=json`);

        if (response.ok) {
            let _token = await response.json();
            backgroundConnect({
                type: "saveSession",
                session: _token.session
            })

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

function backgroundConnect(requestObj, callback) {
    // connects to background script by sending msg
    let _req = requestObj;
    let _call = callback;

    chrome.runtime.sendMessage(_req, _call);

};

function authTab() {
    setInterval(()=> {
        console.log(document.title)
    }, 3000)
}

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
    backgroundConnect({type:'extensionScript'},
    // callback
    function(result) {
        console.log(result)
        lastfm = {
            ...result
        };

        if (lastfm.session === null) {
            unAuthMsg.classList.remove("hidden");
        } else {
            connectBtn.innerText = "Connected";
            nowPlaying.classList.remove("hidden");
        }

        if (lastfm.nowPlaying !== null) {
            songTitle.innerText = lastfm.nowPlaying.track;
            songArtist.innerText = lastfm.nowPlaying.artist;
            songScrobbles.innerText = `Scrobbles: ${lastfm.nowPlaying.playCount}`;
            loveBtn.src = lastfm.nowPlaying.isLoved ? "./images/love.svg" : "./images/love1.svg";
        }
        
        if (lastfm.username !== null) {
            messaging.innerText = `Welcome ${lastfm.username}`;
        }

        if (lastfm.scrobbleEnabled) {
            scrobbleToggle.checked = true;
            if (lastfm.scrobbleAt === "end") {
                scrobbleSelect.children[1].selected = true;
            }
        }
    });
}

init();