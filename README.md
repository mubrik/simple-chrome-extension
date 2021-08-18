# simple-chrome-extension
building a simple chrome extension
logs all the music i listen to on youtube music

added functionality for scrobbling tracks to lastfm


todo:
1. move nowplaying and scrobbling logic from content script to background script,
this allows for more consistent retries incase of request/logic error

2. implement error obj to notify user

3. package file for chrome webstore deployment