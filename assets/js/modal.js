const openModal = (modal) => {
    modal.setAttribute("open", "")
    window.setTimeout(() => {
        modal.removeAttribute("close")
    }, 1)
    document.documentElement.setAttribute("overlay", "")
}

const closeModal = (modal) => {
    window.setTimeout(() => {
        modal.removeAttribute("open")
    }, 300)
    modal.setAttribute("close", "")
    document.documentElement.removeAttribute("overlay")
}

const toggleModal = (event) => {
    const modal = document.getElementById(event.currentTarget.getAttribute("data-target"))
    if (modal !== null) {
        modal.hasAttribute("open") ? closeModal(modal) : openModal(modal)
    }
}

// close with a click outside
document.addEventListener("click", (event) => {
    const modal = document.querySelector("dialog[open]:not([close])")
    if (modal !== null && !modal.querySelector("article").contains(event.target)) {
        closeModal(modal)
    }
})

// close with esc key
document.addEventListener("keyup", (event) => {
    const modal = document.querySelector("dialog[open]:not([close])")
    if (event.key === "Escape") {
        closeModal(modal)
    }
})
