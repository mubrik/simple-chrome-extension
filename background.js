/* chrome.history.onVisited(
    (historyItem) => {
        console.log(historyItem, "working")
    }
) */

console.log("hello")
try {
    console.log(chrome.history.onVisited.addListener(
        (historyObj) => console.log(historyObj)
    ))
} catch (e) {
    console.log(e)
}

