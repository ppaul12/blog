---
---

# init in-site search

window.addEventListener("load", () ->
    sjs = SimpleJekyllSearch({
        json: "/assets/json/search.json"
        searchInput: document.getElementById("search-input")
        resultsContainer: document.getElementById("search-results")
        searchResultTemplate:
            "<article class=\"card-gradient-hover\"><hgroup>
                <h3><a href=\"{url}\">{title}</a></h3>
                <h4><em>{info}</em></h4>
            </hgroup></article>"
        noResultsText: "<article>No results found</article>"
        limit: 20
    })
    return
)

document.addEventListener("keyup", (e) ->
    if e.key == "/"
        document.getElementById("search-input").focus()
    return
)
