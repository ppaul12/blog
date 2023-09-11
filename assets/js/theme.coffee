---
---

# init theme switcher

getPreferredTheme = () ->
    if window.matchMedia("(prefers-color-scheme: dark)").matches
        "dark"
    else
        "light"

getGlobalTheme = () ->
    window.localStorage.getItem("theme") ? "auto"

setGlobalTheme = (theme) ->
    theme = theme ? getGlobalTheme()
    theme = getPreferredTheme() if theme == "auto"
    document.querySelector("html").setAttribute("data-theme", theme)
    window.localStorage.setItem("theme", theme)
    return

toggleGlobalTheme = () ->
    setGlobalTheme(if getGlobalTheme() == "dark" then "light" else "dark")
    return

window.addEventListener("load", () ->
    # generate theme button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.onclick = toggleGlobalTheme
    button.innerHTML = "<i class=\"fa-solid fa-lightbulb faa-flash faa-slow\"></i>"
    button.style.order = -2
    document.querySelector(".button-box").appendChild(button)
    # init theme switcher
    setGlobalTheme()
    return
)
