---
---

# init toc modal

window.addEventListener("load", () ->
    unless (toc = document.getElementById("markdown-toc"))? then return
    # copy toc to modal
    toc.className = "tree-list"
    document.querySelector("#toc-box article").appendChild(toc)
    # generate toc button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.setAttribute("data-target", "toc-box")
    button.onclick = toggleModal
    button.innerHTML = "<i class=\"fa-solid fa-bars-staggered faa-shake faa-slow\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return
)
