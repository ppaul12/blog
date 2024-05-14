window.addEventListener("load", () => {
    const sjs = SimpleJekyllSearch({
        json: "/assets/json/search.json",
        searchInput: document.getElementById("search-input"),
        resultsContainer: document.getElementById("search-results"),
        searchResultTemplate: `<li><a href="{url}">{title}</a> <em>{info}</em></li>`,
        limit: 20,
    })
})

document.addEventListener("keyup", (event) => {
    if (event.key === "/") {
        document.getElementById("search-input").focus()
    }
})
