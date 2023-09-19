---
---

updateAll = () ->
    url = new URL(document.location)
    targetTags = url.searchParams.getAll("tag")
    # update post list
    for item in document.querySelectorAll(".tag-posts > *")
        do (item) ->
            sourceTags = item.getAttribute("data-tags").split(" ")
            if targetTags.every((tag) -> sourceTags.includes(tag))
                item.setAttribute("active", "")
            else
                item.removeAttribute("active")
            return
    # update button states
    for item in document.querySelectorAll(".tag-cloud > *")
        do (item) ->
            if targetTags.includes(item.id)
                item.setAttribute("active", "")
            else
                item.removeAttribute("active")
            return
    return

window.toggleTag = (e) ->
    # update html href
    url = new URL(document.location)
    tags = url.searchParams.getAll("tag")
    url.searchParams.delete("tag")
    if tags.includes(e.target.id)
        tags = tags.filter((tag) -> tag != e.target.id)
    else
        tags.push(e.target.id)
    url.searchParams.append("tag", tag) for tag in tags
    window.history.replaceState(null, null, url.href)
    # update contents
    updateAll()
    return

window.addEventListener("load", (e) ->
    updateAll()
    return
)
