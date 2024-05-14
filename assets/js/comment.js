const setCommentTheme = (theme) => {
    document.querySelector("iframe.utterances-frame").contentWindow.postMessage({
        type: "set-theme",
        theme: `github-${theme}`,
    }, "https://utteranc.es")
}

window.addEventListener("message", (event) => {
    if (event.origin === "https://utteranc.es") {
        // set theme dynamically
        setCommentTheme(document.documentElement.getAttribute("data-theme"))
        // change theme dynamically
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "data-theme") {
                    setCommentTheme(mutation.target.getAttribute(mutation.attributeName))
                }
            })
        })
        observer.observe(document.documentElement, { attributes: true })
    }
})
