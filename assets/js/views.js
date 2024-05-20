const getViewMode = () => {
    if (window.localStorage.getItem("is-incognito") !== null) {
        return window.localStorage.getItem("is-incognito")
    }

    const url = new URL(document.location)
    const mode = (url.searchParams.get("incognito") !== null) ? "true" : "false"
    window.localStorage.setItem("is-incognito", mode)
    return mode
}

if (getViewMode() === "true") {
    window.goatcounter = { no_onload: true }
}

window.addEventListener("load", () => {
    const pageView = document.getElementById("page-view")
    if (pageView !== null) {
        fetch(`https://peng-ao.goatcounter.com/counter/${encodeURIComponent(location.pathname)}.json`)
            .then((response) => response.json())
            .then((data) => {
                pageView.setAttribute("data-tooltip", `${data.count.replace(' ', '')} views`)
            })
            .catch(() => {
                pageView.setAttribute("data-tooltip", "1 view")
            })
    }

    const siteView = document.getElementById("site-view")
    if (siteView !== null) {
        fetch("https://peng-ao.goatcounter.com/counter/TOTAL.json")
            .then((response) => response.json())
            .then((data) => {
                siteView.innerText = `${data.count.replace(' ', '')} views in total`
            })
            .catch(() => {
                siteView.innerText = "1 view in total"
            })
    }
})
