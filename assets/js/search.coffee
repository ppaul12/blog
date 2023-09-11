---
---

# init in-site search

window.addEventListener("load", () ->
    # create search modal
    modal = document.createElement("dialog")
    modal.id = "search-box"
    modal.innerHTML =
        "<article>
            <header>
                <div class=\"close-btn\" data-target=\"search-box\" onclick=\"toggleModal(event)\"></div>
                <input id=\"search-input\" type=\"search\" placeholder='press \"/\" to search ...'>
            </header>
            <div id=\"search-results\"></div>
        </article>"
    document.querySelector("main").appendChild(modal)
    # generate search button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.setAttribute("data-target", "search-box")
    button.onclick = toggleModal
    button.style.order = -1
    button.innerHTML = "<i class=\"fa-solid fa-magnifying-glass faa-wrench faa-slow\"></i>"
    document.querySelector(".button-box").appendChild(button)
    # init search engine
    sjs = SimpleJekyllSearch({
        json: "/assets/json/search.json"
        searchInput: document.getElementById("search-input")
        resultsContainer: document.getElementById("search-results")
        searchResultTemplate:
            "<article onclick=\"location.href='{url}'\"><hgroup>
                <h3>{icon} {title}</h3>
                <h4><em>{info}</em></h4>
            </hgroup></article>"
        noResultsText: "<article>No results found</article>"
        limit: 10
    })
    return
)

document.addEventListener("keyup", (e) ->
    if e.key == "/"
        document.getElementById("search-input").focus()
    return
)
