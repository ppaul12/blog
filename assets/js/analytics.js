---
---

const pathname = ("{{ site.baseurl }}".length > 0) ?
    window.location.pathname.replace(new RegExp("^{{ site.baseurl }}/"), "/") :
    window.location.pathname

// anonymous mode
const isAnonymous = () => {
    if (window.sessionStorage.getItem("is-anonymous") !== null) {
        return window.sessionStorage.getItem("is-anonymous")
    }

    const url = new URL(window.location)
    const mode = (url.searchParams.get("anonymous") !== null) ? "true" : "false"
    window.sessionStorage.setItem("is-anonymous", mode)
    return mode
}

if (isAnonymous() === "true") {
    window.goatcounter = { no_onload: true }
} else {
    window.goatcounter = { path: pathname }
}

// load all kinds of view numbers
window.addEventListener("load", () => {
    // load page view number
    const pageView = document.getElementById("page-view")
    if (pageView !== null) {
        fetch(`https://{{ site.thirdparty.goatcounter.code }}.goatcounter.com/counter/${encodeURIComponent(pathname)}.json`)
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
        fetch("https://{{ site.thirdparty.goatcounter.code }}.goatcounter.com/counter/TOTAL.json")
            .then((response) => response.json())
            .then((data) => {
                siteView.innerText = `${data.count.replace(' ', '')} views`
            })
            .catch(() => {
                siteView.innerText = "1 view"
            })
    }
})
