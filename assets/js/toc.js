window.addEventListener("load", () => {
    const toc = document.getElementById("markdown-toc")
    if (toc !== null) {
        // copy toc to modal
        toc.className = "tree-list"
        document.querySelector("#toc-box article").appendChild(toc)
        // activate toc button
        document.getElementById("toc-btn").setAttribute("active", "")
    }
})
