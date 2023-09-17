---
---

# init modal opener

openModal = (modal) ->
    modal.setAttribute("open", "")
    window.setTimeout(() ->
        modal.removeAttribute("close")
        return
    , 1)
    document.documentElement.setAttribute("overlay", "")
    return

closeModal = (modal) ->
    window.setTimeout(() ->
        modal.removeAttribute("open")
        return
    , 300)
    modal.setAttribute("close", "")
    document.documentElement.removeAttribute("overlay")
    return

toggleModal = (e) ->
    modal = document.getElementById(e.currentTarget.getAttribute("data-target"))
    if modal?.hasAttribute("open")
        closeModal(modal)
    else
        openModal(modal)
    return
window.toggleModal = toggleModal

# close with a click outside
document.addEventListener("click", (e) ->
    unless (modal=document.querySelector("dialog[open]:not([close])"))? then return
    content = modal.querySelector("article")
    if not content.contains(e.target) then closeModal(modal)
    return
)

# close with esc key
document.addEventListener("keydown", (e) ->
    unless (modal=document.querySelector("dialog[open]:not([close])"))? then return
    if e.key == "Escape" then closeModal(modal)
    return
)
