chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.type === "updateLocalNowPLaying") {
            // make sure variables are valid
            if(request.artist && request.title) {

                // set some vars
                let userPlayCount = null;
                let userLoved = false

                // lastfm request body data
                let bodyData = {
                    artist: request.artist,
                    track: request.title
                }
                // make auth call
                makeAuthenticatedReq("POST", "track.updateNowPlaying", bodyData)

                // get song details from latfm
                makeUnAuthenticatedReq("GET", "track.getInfo", {
                    ...bodyData,
                    username: lastfm.username
                }).then(result => {

                    if (result.track) {
                        console.log(result)
                        userPlayCount = result.track.userplaycount;
                        userLoved = result.track.userloved === "0" ? false : true;
                    }

                    // store in sync storage
                    saveToStorageSync("nowPlaying",
                        {
                            ...bodyData,
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
                track: request.title
            }
            // make auth call
            if (lastfm.scrobbleEnabled) {
                makeAuthenticatedReq("POST", "track.scrobble", bodyData)
            }
            // callback
            sendResponse({msg: "done"})
            
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

        } else if (request.type === "updateLove") {

            // lastfm request body data
            let bodyData = {
                artist: lastfm.nowPlaying.artist,
                track: lastfm.nowPlaying.track
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

        } else if (request.type === "updateScrobbleSettings") {

            // update scrobbleenabled value in storage
            saveToStorageSync("scrobbleEnabled", request.value);

        } else if (request.type === "updateScrobbleAt") {

            // update scrobbleAt value in storage
            saveToStorageSync("scrobbleAt", request.value);

        } else if (request.type === "unloading") {
            console.log("music player closing")

        } else if (request.type === "getTrackInfo") {
            // experimental
            // fetch track info
            /* let bodyData = {
                artist: lastfm.nowPlaying.artist,
                track: lastfm.nowPlaying.track,
                username: lastfm.username
            }
            makeUnAuthenticatedReq("GET", "track.getInfo", bodyData) */

        } else if (request.type === "newTab") {
            // experimental
            /* chrome.tabs.create({
                active: false,
                url: "https://www.google.com/"
            }, 
            
            function (tab) {
                console.log(tab)

                chrome.scripting.executeScript(
                    {
                      target: {tabId: tab.id},
                      function: function () {
                            setInterval(()=> {
                                console.log(window.document.title)
                            }, 3000)
                      },
                    },
                    (injectionResults) => {
                        console.log(injectionResults);
                    }
                );


            }) */
        }
    }
);

// when youtube music is closing, clean up
chrome.runtime.onSuspend.addListener(
    console.log("clean up")
    // this triggers on background script, not chrome or yt music closing
    // less useful, need to implement clean up logic for now playing object
);