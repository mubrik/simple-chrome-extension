/** listener for lastfmauth */
chrome.tabs.onUpdated.addListener(lastfmListener);

/** listener for messages from contentscript/extscript */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("backg received", request);
    if (request.type === "updateLove") {
      // lastfm request body data
      const bodyData = {
        artist: lastfm.nowPlaying.artist,
        track: lastfm.nowPlaying.track,
        api_key: lastfm.apiKey,
        sk: lastfm.session,
      };
      // check current storage for love status
      const isLove = lastfm.nowPlaying.isLoved ? "track.unlove" : "track.love";

      // make req based on check
      makeAuthenticatedReq("POST", isLove, bodyData);

      // update sync storage
      saveToStorageSync("nowPlaying", {
        ...lastfm.nowPlaying,
        isLoved: !lastfm.nowPlaying.isLoved,
      });
      // callback
      sendResponse({msg: true, status: isLove});
    } else if (request.type === "userProfile") {
      // creates the auth tab
      chrome.tabs.create({
        active: true,
        url: request.url,
      });
    } else if (request.type === "authUser") {
      // creates the auth tab
      chrome.tabs.create({
        active: true,
        url: request.url,
      });
    } else if (request.type === "contentScript" ) {
      // checks if content script should run
      if (lastfm.session && lastfm.token) {
        sendResponse({
          msg: true,
          ...lastfm,
        });
      } else {
        sendResponse({
          msg: false,
          ...lastfm,
        });
      }
    } else if (request.type === "extensionScript") {
      // extension scripts requesting variables
      sendResponse({
        msg: true,
        ...lastfm,
      });
    } else if (request.type === "saveToken") {
      // ext script saving token
      saveToStorageSync("token", request.token);
    } else if (request.type === "saveSession") {
      // ext script saving session
      chrome.storage.sync.set({
        "session": request.session["key"],
        "username": request.session["name"],
        "subscriber": request.session["subscriber"],
      });
      storeAllStorageSyncDataLocal();
    } else if (request.type === "updateScrobbleSettings") {
      // update scrobbleenabled value in storage
      saveToStorageSync("scrobbleEnabled", request.value);
    } else if (request.type === "updateScrobbleAt") {
      // update scrobbleAt value in storage
      saveToStorageSync("scrobbleAt", request.value);
    } else if (request.type === "unloading") {
      // when youtube music is closing, clean up
      saveToStorageSync("nowPlaying",
        {
          id: null,
          isScrobbled: false,
          isPlayingOnLastfm: false,
        },
      );
    } else if (request.type === "playingSong") {
      // experimental moving scrobble/now playing logic from content script here
      // validation
      if (request.artist && request.title) {
        if (lastfm.session === null) {
          return;
        }
        // params
        const trackData = {
          id: request.id,
          artist: request.artist,
          track: request.title,
          timers: request.timers,
          isVideo: request.isVideo,
        };

        // compare with storage cache now playing
        if (!(trackData.id === lastfm.nowPlaying.id)) {
          // update local
          updateTrackLocal(trackData);
        }

        if (lastfm.nowPlaying.id !== null &&
        !lastfm.nowPlaying.isPlayingOnLastfm) {
          // not same track, and hasnt been updated on lastfm
          updateTrackLastFM(trackData);
        }

        // check timers
        if (isSongAtScrobbleTime(trackData) &&
                !lastfm.nowPlaying.isScrobbled) {
          // scrobble, checks for settings implemented
          scrobbleTrackToLastFm(trackData);
        }
      }
    } else if (request.type === "trackSeek") {
      // always reset track variables is af a new track if track seeked < 10secs
      // using save storage so local cache is updated
      saveToStorageSync("nowPlaying", {
        id: null,
        isScrobbled: false,
        isPlayingOnLastfm: false,
      });
    } else if (request.type === "getTrackInfo") {
      // experimental
      // fetch track info
      /* let bodyData = {
                artist: lastfm.nowPlaying.artist,
                track: lastfm.nowPlaying.track,
                username: lastfm.username
            }
            makeUnAuthenticatedReq("GET", "track.getInfo", bodyData) */

    }
  },
);

// if extension installed and session key available, remove listener
// if (lastfm.isInstalled && lastfm.session) {
//     chrome.tabs.onUpdated.removeListener(lastfmListener)
// }
// not needed, if user ever revokes key unable to listen, tweak implementation
