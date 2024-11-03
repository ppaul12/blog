const setCommentTheme = (theme) => {
    document.querySelector("iframe.giscus-frame").contentWindow.postMessage({
        giscus: {
            setConfig: {
                theme: {
                    "light": "light",
                    "dark": "dark_dimmed",
                }[theme]
            }
        }
    }, "https://giscus.app")
}

window.addEventListener("message", (event) => {
    if (event.origin === "https://giscus.app") {
        setCommentTheme(document.documentElement.dataset.theme)
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
