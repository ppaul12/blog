---
---

# init toc modal

window.addEventListener("load", () ->
    unless (toc = document.getElementById("markdown-toc"))? then return
    # copy toc to modal
    toc.className = "tree-list"
    document.querySelector("#toc-box article").appendChild(toc)
    # activate toc button
    document.getElementById("toc-btn").setAttribute("active", "")
    return
)
