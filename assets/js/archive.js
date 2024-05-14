const updateAll = () => {
    const url = new URL(document.location)
    const targetTags = url.searchParams.getAll("tag")
    // update post list
    document.querySelectorAll(".tag-posts > *").forEach((item) => {
        const sourceTags = item.getAttribute("data-tags").split(" ")
        if (targetTags.every((tag) => sourceTags.includes(tag))) {
            item.setAttribute("active", "")
        } else {
            item.removeAttribute("active")
        }
    })
    // update button states
    document.querySelectorAll(".tag-cloud > *").forEach((item) => {
        if (targetTags.includes(item.id)) {
            item.setAttribute("active", "")
        } else {
            item.removeAttribute("active")
        }
    })
}

const toggleTag = (event) => {
    // update html href
    const url = new URL(document.location)
    let tags = url.searchParams.getAll("tag")
    url.searchParams.delete("tag")
    if (tags.includes(event.target.id)) {
        tags = tags.filter((tag) => tag !== event.target.id)
    } else {
        tags.push(event.target.id)
    }
    tags.forEach((tag) => url.searchParams.append("tag", tag))
    window.history.replaceState(null, null, url.href)
    // update contents
    updateAll()
}

window.addEventListener("load", () => updateAll())
