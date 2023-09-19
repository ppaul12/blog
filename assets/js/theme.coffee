---
---

# init theme switcher

getPreferredTheme = () ->
    if window.matchMedia("(prefers-color-scheme: dark)").matches
        "dark"
    else
        "light"

getTheme = () ->
    window.localStorage.getItem("data-theme") ? getPreferredTheme()

setTheme = (theme) ->
    theme = theme ? getTheme()
    document.documentElement.setAttribute("data-theme", theme)
    window.localStorage.setItem("data-theme", theme)
    return

window.toggleTheme = () ->
    setTheme({
        "light": "dark"
        "dark": "light"
    }[getTheme()])
    return

window.addEventListener("load", () ->
    setTheme()
    return
)
