---
---

# init in-site search

window.addEventListener("load", () ->
    sjs = SimpleJekyllSearch({
        json: "/assets/json/search.json"
        searchInput: document.getElementById("search-input")
        resultsContainer: document.getElementById("search-results")
        searchResultTemplate: "<li><a href=\"{url}\">{title}</a> <em>{info}</em></li>"
        noResultsText: "Oops, no results found"
        limit: 20
    })
    return
)

document.addEventListener("keyup", (e) ->
    if e.key == "/"
        document.getElementById("search-input").focus()
    return
)
