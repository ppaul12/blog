---
---

# init toc modal

window.addEventListener("load", () ->
    unless (toc = document.getElementById("markdown-toc"))? then return
    # move toc to modal
    tree = document.createElement("div")
    tree.classList = "tree-list"
    tree.appendChild(toc)
    document.querySelector("#toc-box article").appendChild(tree)
    # generate toc button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.setAttribute("data-target", "toc-box")
    button.onclick = toggleModal
    button.innerHTML = "<i class=\"fa-solid fa-bars-staggered faa-shake faa-slow\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return
)
