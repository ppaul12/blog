// init responding details
function initRespondingDetails() {
    window.addEventListener("load", () => {
        const tag = decodeURI(location.hash).substring(1)
        if (tag.length > 0) {
            document.getElementById(tag).open = true
        }
    })
    window.addEventListener("hashchange", () => {
        const tag = decodeURI(location.hash).substring(1)
        document.querySelectorAll("details").forEach(details => {
            details.open = details.id == tag
        })
    })
}
