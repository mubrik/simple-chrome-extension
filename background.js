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
        } else if (request.type === "startScript" || request.type === "extensionScript") {
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

        }
    }
);

/* chrome.alarms.create("tracker", { delayInMinutes: 1 })

chrome.alarms.onAlarm.addListener(() => {
    console.log("sending msg")
    chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
        console.log(response.msg);
    })
}); */
