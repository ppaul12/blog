---
---

# init profile display

window.addEventListener("load", () ->
    # generate profile button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.setAttribute("data-target", "profile-box")
    button.onclick = toggleModal
    button.style.order = -3
    button.innerHTML = "<i class=\"fa-solid fa-user-graduate faa-horizontal faa-slow\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return
)
