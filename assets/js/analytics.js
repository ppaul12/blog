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

// post reaction
const clickReaction = (event) => {
    if (isAnonymous() === "true") {
        window.alert("Post reactions are not supported when using anonymous mode.")
        return
    }

    const reactionBlock = document.querySelector(".post-reaction")
    if (reactionBlock.getAttribute("disabled") !== null) {
        return
    }

    const reactionButton = event.target
    window.goatcounter.count({
        path: `${reactionButton.dataset.tag}${window.location.pathname}`,
        title: `${document.title}#${reactionButton.dataset.tag}`,
        event: true,
    })
    reactionButton.dataset.num = Number(reactionButton.dataset.num) + 1
    reactionButton.setAttribute("active", "")
    reactionBlock.setAttribute("disabled", "")
    window.localStorage.setItem(window.location.pathname, reactionButton.dataset.tag)
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
    // load post reaction number
    const postReaction = document.querySelector(".post-reaction")
    if (postReaction !== null) {
        Array.from(postReaction.children).forEach((item) => {
            // init button state
            if (window.localStorage.getItem(window.location.pathname) === item.dataset.tag) {
                item.setAttribute("active", "")
                postReaction.setAttribute("disabled", "")
            }
            // fetch reaction number
            fetch(`https://peng-ao.goatcounter.com/counter/${item.dataset.tag}${encodeURIComponent(window.location.pathname)}.json`)
                .then((response) => response.json())
                .then((data) => {
                    item.dataset.num = data.count.replace(' ', '')
                })
                .catch(() => {
                    item.dataset.num = 0
                })
        })
    }
})
