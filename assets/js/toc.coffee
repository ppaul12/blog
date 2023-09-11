---
---

# init toc modal

window.addEventListener("load", () ->
    if (toc = document.getElementById("markdown-toc"))?
        # create toc modal
        article = document.createElement("article")
        article.innerHTML =
            "<header><nav>
                <ul>TOC</ul>
                <ul class=\"close-btn\" data-target=\"toc-box\" onclick=\"toggleModal(event)\"></ul>
            </nav></header>"
        modal = document.createElement("dialog")
        modal.id = "toc-box"
        modal.appendChild(article)
        document.querySelector("main").appendChild(modal)
        # move toc to modal
        tree = document.createElement("div")
        tree.classList = "tree-list"
        tree.appendChild(toc)
        article.appendChild(tree)
        # generate toc button
        button = document.createElement("button")
        button.className = "contrast faa-parent animated-hover"
        button.setAttribute("data-target", "toc-box")
        button.onclick = toggleModal
        button.innerHTML = "<i class=\"fa-solid fa-bars-staggered faa-shake faa-slow\"></i>"
        document.querySelector(".button-box").appendChild(button)
    return
)
