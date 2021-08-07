console.log("wrapper script")

try {
    importScripts("keys.js","md5.js", "request.js","setting.js","background.js");
} catch (error) {
    console.log(error);
}
