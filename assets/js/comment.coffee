---
---

# init comment auto-theme

setCommentTheme = (theme) ->
    document.querySelector("iframe.utterances-frame").contentWindow.postMessage({
        type: "set-theme"
        theme: "github-#{theme}"
    }, "https://utteranc.es")
    return

window.addEventListener("message", (e) ->
    if e.origin == "https://utteranc.es"
        # set theme dynamically
        setCommentTheme(document.querySelector("html").getAttribute("data-theme"))
        # change theme dynamically
        observer = new MutationObserver((mutations) ->
            mutations.forEach((mutation) ->
                if mutation.attributeName == "data-theme"
                    setCommentTheme(mutation.target.getAttribute(mutation.attributeName))
                return
            )
            return
        )
        observer.observe(document.querySelector("html"), {attributes: true})
    return
)
