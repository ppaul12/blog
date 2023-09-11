---
---

# init responding details

window.addEventListener("load", () ->
    tag = window.decodeURI(window.location.hash)[1...]
    if tag.length > 0
        document.getElementById(tag).open = true
    return
)

window.addEventListener("hashchange", () ->
    tag = window.decodeURI(window.location.hash)[1...]
    document.querySelectorAll("details").forEach((details) ->
        details.open = details.id == tag
    )
    document.getElementById(tag).scrollIntoView()
    return
)
