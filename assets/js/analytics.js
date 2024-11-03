// anonymous mode
const isAnonymous = () => {
    if (window.localStorage.getItem("is-anonymous") !== null) {
        return window.localStorage.getItem("is-anonymous")
    }

    const url = new URL(document.location)
    const mode = (url.searchParams.get("anonymous") !== null) ? "true" : "false"
    window.localStorage.setItem("is-anonymous", mode)
    return mode
}

if (isAnonymous() === "true") {
    window.goatcounter = { no_onload: true }
}

// load all kinds of view numbers
window.addEventListener("load", () => {
    // load page view number
    const pageView = document.getElementById("page-view")
    if (pageView !== null) {
        fetch(`https://peng-ao.goatcounter.com/counter/${encodeURIComponent(window.location.pathname)}.json`)
            .then((response) => response.json())
            .then((data) => {
                pageView.dataset.tooltip = `${data.count.replace(' ', '')} views`
            })
            .catch(() => {
                pageView.dataset.tooltip = "1 view"
            })
    }
    // load total view number
    const siteView = document.getElementById("site-view")
    if (siteView !== null) {
        fetch("https://peng-ao.goatcounter.com/counter/TOTAL.json")
            .then((response) => response.json())
            .then((data) => {
                siteView.innerText = `${data.count.replace(' ', '')} views`
            })
            .catch(() => {
                siteView.innerText = "1 view"
            })
    }
})
