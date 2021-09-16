# simple-chrome-extension
building a simple chrome extension
logs all the music i listen to on youtube music

added functionality for scrobbling tracks to lastfm


todo:
1. move nowplaying and scrobbling logic from content script to background script,
this allows for more consistent retries incase of request/logic error - done

2. implement error obj to notify user

3. package file for chrome webstore deployment

4. scrobble videos option

5. youtube likes = like track on lastfm

md5 script: https://www.myersdaily.org/joseph/javascript/md5-text.html

utf8 script: https://github.com/mathiasbynens/utf8.js