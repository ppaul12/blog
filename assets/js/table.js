// init scrollable table
function initTableScroll() {
    window.addEventListener("load", () => {
        document.querySelectorAll("table").forEach(tbl => {
            tbl.outerHTML = `<figure>${tbl.outerHTML}</figure>`
        })
    })
}
