const openModal = (modal) => {
    modal.toggleAttribute("open", true)
    window.setTimeout(() => {
        modal.toggleAttribute("close", false)
    }, 1)
    document.documentElement.setAttribute("overlay", "")
}

const closeModal = (modal) => {
    window.setTimeout(() => {
        modal.toggleAttribute("open", false)
    }, 300)
    modal.toggleAttribute("close", true)
    document.documentElement.removeAttribute("overlay")
}

const toggleModal = (event) => {
    const modal = document.getElementById(event.currentTarget.dataset.target)
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
    if (modal !== null && event.key === "Escape") {
        closeModal(modal)
    }
})
