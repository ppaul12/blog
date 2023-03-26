// init insite search
function initSearch() {
    window.addEventListener("load", () => {
        let button = document.createElement("button")
        button.className = "contrast faa-parent animated-hover"
        button.setAttribute("data-target", "search-box")
        button.onclick = toggleModal
        button.style.order = -1
        button.innerHTML = `<i class="fa-solid fa-magnifying-glass faa-wrench faa-slow"></i>`
        document.querySelector(".button-box").appendChild(button)
        const sjs = SimpleJekyllSearch({
            json: "/assets/json/search.json",
            searchInput: document.getElementById("search-input"),
            resultsContainer: document.getElementById("search-results"),
            searchResultTemplate: `
                <article onclick="location.href='{url}'"><hgroup>
                    <h3>{icon} {title}</h3>
                    <h4><em>{info}</em></h4>
                </hgroup></article>
            `,
            noResultsText: "<article>No results found</article>",
            limit: 10
        })
    })
    document.addEventListener("keyup", e => {
        if (e.key == "/") {
            document.getElementById("search-input").focus()
        }
    })
}
