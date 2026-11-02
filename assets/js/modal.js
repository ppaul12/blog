// Attribute-driven modal transitions, shared by data-modal controls.
(() => {
    const openModal = (modal) => {
        modal.showModal()
        requestAnimationFrame(() => modal.removeAttribute("data-closed"))
    }

    const closeModal = (modal) => {
        if (modal.hasAttribute("data-closed")) return
        modal.setAttribute("data-closed", "")
        setTimeout(() => modal.close(), 200)
    }

    document.addEventListener("click", (event) => {
        const control = event.target.closest("[data-modal]")
        if (control) {
            const modal = document.getElementById(control.dataset.modal)
            if (!modal) return
            modal.open ? closeModal(modal) : openModal(modal)
        } else if (event.target.matches("dialog.site-modal[open]")) {
            closeModal(event.target)
        }
    })

    document.addEventListener("cancel", (event) => {
        if (!event.target.matches("dialog.site-modal")) return
        event.preventDefault()
        closeModal(event.target)
    }, true)
})()
