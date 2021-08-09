chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.type === "nowPlaying") {

            console.log(request)
            let bodyData = {
                artist: request.track.artist,
                title: request.track.title
            }
            console.log(bodyData)
            /* makeAuthenticatedReq("POST", "track.updateNowPlaying", bodyData) */
            sendResponse({msg: "done"})

        } else if (request.type === "scrobble") {

            console.log(request)
            // get current time
            let utcTime = Date.now()
            // subtrack elapsed track time
            let timestamp = utcTime - request.track.timers[0];

            let bodyData = {
                timestamp,
                artist: request.track.artist,
                title: request.track.title
            }

            console.log(bodyData)
            /* makeAuthenticatedReq("POST", "track.scrobble", bodyData) */
            sendResponse({msg: "done"})
            
        } else if (request.type === "contentScript" ) {
            console.log("should bg script start")
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
            console.log("ext script go")
            sendResponse({
                msg:true,
                ...lastfm
            })

        } else if (request.type === "saveToken") {
            console.log("ext save token")
                saveToStorageSync("token", request.token)
                
        } else if (request.type === "saveSession") {
            console.log("ext save session")
                saveToStorageSync("token", request.token)
        } else if (request.type === "updateLocalNowPLaying") {
            if(request.artist && request.title) {
                console.log("backg s updating now playing")
                saveToStorageSync("nowPlaying",
                    {
                        title: request.title,
                        artist: request.artist
                    }
                )
            }
        }
    }
);

// when youtube music is closing, clean up
chrome.runtime.onSuspend.addListener(
    console.log("clean up")
);