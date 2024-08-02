const updateAll = () => {
    const url = new URL(document.location)
    const targetTags = url.searchParams.getAll("tag")
    // update post list
    document.querySelectorAll(".tag-posts > *").forEach((item) => {
        const sourceTags = item.dataset.tags.split(" ")
        item.toggleAttribute("active", targetTags.every((tag) => sourceTags.includes(tag)))
    })
    // update button states
    document.querySelectorAll(".tag-cloud > *").forEach((item) => {
        item.toggleAttribute("active", targetTags.includes(item.id))
    })
    // update post counts
    document.querySelectorAll(".tag-posts:has(*[active]").forEach((item) => {
        const count = item.querySelectorAll("*[active]").length
        item.dataset.count = `${count} post${count > 1 ? 's' : ''}`
    })
    // refresh aos calculation
    AOS.refresh()
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

updateAll()
