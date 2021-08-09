console.log("wrapper script")

try {
    importScripts("keys.js","md5.js", "request.js","settings.js","background.js");
} catch (error) {
    console.log(error);
}
