chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.type === "updateLocalNowPLaying") {
            // make sure variables are valid
            if(request.artist && request.title) {

                // set some vars
                let userPlayCount = null;
                let userLoved = false
                let trackData = {
                    artist: request.artist,
                    track: request.title,
                }

                // lastfm request body data
                let bodyData = {
                    ...trackData,
                    api_key: lastfm.apiKey,
                    sk: lastfm.session
                }
                // make auth call
                makeAuthenticatedReq("POST", "track.updateNowPlaying", bodyData)

                // get song details from latfm
                makeUnAuthenticatedReq("GET", {
                    ...trackData,
                    api_key: lastfm.apiKey,
                    username: lastfm.username,
                    method: "track.getInfo",
                    format: "json"
                }).then(result => {

                    if (result.track) {
                        userPlayCount = result.track.userplaycount;
                        userLoved = result.track.userloved === "0" ? false : true;
                    }

                    // store in sync storage
                    saveToStorageSync("nowPlaying",
                        {
                            ...trackData,
                            playCount: userPlayCount,
                            isLoved: userLoved
                        }
                    )
                })
                // callback
                sendResponse({msg: "done"})
            }
        } else if (request.type === "scrobble") {

            // get current time in ms
            let utcTime = Date.now()
            // subtrack elapsed track time
            let timestamp = utcTime - request.timers[0];
            // convert to seconds
            let timestampSec = Math.floor(timestamp / 1000);
            // lastfm request body data
            let bodyData = {
                timestamp:timestampSec,
                artist: request.artist,
                track: request.title,
                api_key: lastfm.apiKey,
                sk: lastfm.session
            }
            // make auth call
            if (lastfm.scrobbleEnabled) {
                makeAuthenticatedReq("POST", "track.scrobble", bodyData)
            }
            // callback
            sendResponse({msg: "done"})
            
        } else if (request.type === "updateLove") {

            // lastfm request body data
            let bodyData = {
                artist: lastfm.nowPlaying.artist,
                track: lastfm.nowPlaying.track,
                api_key: lastfm.apiKey,
                sk: lastfm.session
            }
            // check current storage for love status
            let isLove = lastfm.nowPlaying.isLoved ? "track.unlove" : "track.love";

            // make req based on check
            makeAuthenticatedReq("POST", isLove, bodyData)

            // update sync storage
            saveToStorageSync("nowPlaying", {
                ...lastfm.nowPlaying,
                isLoved: !lastfm.nowPlaying.isLoved
            })
            // callback
            sendResponse({msg:true, status: isLove})

        } else if (request.type === "contentScript" ) {

            // checks if content script should run
            if (lastfm.session && lastfm.token) {
                sendResponse({
                    msg:true,
                    ...lastfm
                });
            } else {
                sendResponse({
                    msg:false,
                    ...lastfm
                });
            }

        } else if (request.type === "extensionScript") {
            // extension scripts requesting variables
            sendResponse({
                msg:true,
                ...lastfm,
            })

        } else if (request.type === "saveToken") {
            // ext script saving token
            saveToStorageSync("token", request.token)
                
        } else if (request.type === "saveSession") {
            // ext script saving session
            chrome.storage.sync.set({
                "session": request.session["key"],
                "username": request.session["name"],
                "subscriber": request.session["subscriber"]
            })
            storeAllStorageSyncDataLocal();

        } else if (request.type === "updateScrobbleSettings") {

            // update scrobbleenabled value in storage
            saveToStorageSync("scrobbleEnabled", request.value);

        } else if (request.type === "updateScrobbleAt") {

            // update scrobbleAt value in storage
            saveToStorageSync("scrobbleAt", request.value);

        } else if (request.type === "unloading") {
            // when youtube music is closing, clean up
            chrome.storage.sync.set({"nowPlaying": null})

        } else if (request.type === "getTrackInfo") {
            // experimental
            // fetch track info
            /* let bodyData = {
                artist: lastfm.nowPlaying.artist,
                track: lastfm.nowPlaying.track,
                username: lastfm.username
            }
            makeUnAuthenticatedReq("GET", "track.getInfo", bodyData) */

        } else if (request.type === "authUser") {
            // experimental, creates the auth tab
            chrome.tabs.create({
                active: true,
                url: request.url
            })
        }
    }
);

chrome.tabs.onUpdated.addListener(lastfmListener);

// if extension installed and session key available, remove listener
// if (lastfm.isInstalled && lastfm.session) {
//     chrome.tabs.onUpdated.removeListener(lastfmListener)
// }
// not needed, wouldnt trigger if user ever revoked key, tweak implementation
