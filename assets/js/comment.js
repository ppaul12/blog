---
---

const term = ("{{ site.baseurl }}".length > 0) ?
    window.location.pathname.replace(new RegExp("^{{ site.baseurl }}/"), "") :
    window.location.pathname
const script = document.createElement("script")
script.src = "https://giscus.app/client.js"
script.setAttribute("data-repo", "{{ site.thirdparty.giscus.repo }}")
script.setAttribute("data-repo-id", "{{ site.thirdparty.giscus.repo-id}}")
script.setAttribute("data-category", "{{ site.thirdparty.giscus.category }}")
script.setAttribute("data-category-id", "{{ site.thirdparty.giscus.category-id }}")
script.setAttribute("data-mapping", "specific")
script.setAttribute("data-term", term)
script.setAttribute("data-strict", 0)
script.setAttribute("data-reactions-enabled", 1)
script.setAttribute("data-emit-metadata", 0)
script.setAttribute("data-input-position", "top")
script.setAttribute("data-lang", "en")
script.setAttribute("data-loading", "lazy")
script.setAttribute("crossorigin", "anonymous")
script.async = true
document.getElementById("comment").replaceWith(script)

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
