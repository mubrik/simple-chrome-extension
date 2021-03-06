/* eslint-env browser, commonjs */
// loads all scripts required for background.js to work

try {
  importScripts(
    "./src/js/keys.js",
    "./src/js/utils/md5.js",
    "./src/js/utils/utf8.js",
    "./src/js/utils.js",
    "./src/js/background.js"
  );
} catch (error) {
  console.log(error);
}
