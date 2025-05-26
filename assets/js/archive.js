---
---

const updateAll = () => {
    const url = new URL(window.location)
    const targetTags = url.searchParams.getAll("tag")
    const targetIdxs = url.searchParams.getAll("idx")
    // update post list
    document.querySelectorAll(".tag-posts > *").forEach((item) => {
        const sourceTags = item.dataset.tags.split(" ")
        item.toggleAttribute(
            "active",
            (targetIdxs.length === 0 || targetIdxs.includes(item.dataset.idx))
            && targetTags.every((tag) => sourceTags.includes(tag))
        )
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
updateAll()

const toggleTag = (event) => {
    // update html href
    const url = new URL(window.location)
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

const observer = new MutationObserver(() => {
    const url = new URL(window.location)
    url.searchParams.delete("idx")
    document.getElementById("search-results").childNodes.forEach((data) => {
        url.searchParams.append("idx", data.value)
    })
    window.history.replaceState(null, null, url.href)
    updateAll()
})
observer.observe(document.getElementById("search-results"), { childList: true })

window.addEventListener("load", () => {
    SimpleJekyllSearch({
        json: "{% link assets/json/search.json %}",
        searchInput: document.getElementById("search-input"),
        resultsContainer: document.getElementById("search-results"),
        searchResultTemplate: `<option value="{id}"></option>`,
        limit: "{{ site.posts.size }}",
        fuzzy: true,
    })
})
