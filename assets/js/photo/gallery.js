// Post galleries open inline and can move into an immersive viewer.
const initGallery = (id, data) => {
    const element = document.getElementById(id)
    const gallery = initLightbox(id, data, { inline: true })
    const container = gallery.$container.get()
    let viewer, placeholder, scrollPosition
    let background = []
    const restore = () => {
        if (!viewer) return
        placeholder.replaceWith(container)
        container.classList.add("lg-inline")
        viewer.remove()
        viewer = undefined
        background.forEach(([element, inert]) => { element.inert = inert })
        background = []
        window.scrollTo({ ...scrollPosition, behavior: "instant" })
        gallery.refreshOnResize()
    }
    // Intercept the library's class-only toggle and retain the inline gallery's space.
    container.addEventListener("click", (event) => {
        if (!(event.target instanceof Element) || !event.target.closest(".lg-maximize")) return
        event.preventDefault()
        event.stopImmediatePropagation()
        if (viewer) {
            if (viewer.classList.contains("is-closing")) return
            viewer.addEventListener("animationend", (event) => {
                if (event.target === viewer && event.animationName === "fadeOut") restore()
            })
            viewer.classList.add("is-closing")
            return
        }
        scrollPosition = { left: window.scrollX, top: window.scrollY }
        placeholder = document.createElement("div")
        placeholder.setAttribute("aria-hidden", "true")
        placeholder.style.height = `${container.getBoundingClientRect().height}px`
        placeholder.style.margin = getComputedStyle(container).margin
        container.before(placeholder)
        viewer = document.createElement("div")
        viewer.className = "gallery-maximized-overlay"
        document.body.append(viewer)
        viewer.append(container)
        container.classList.remove("lg-inline")
        background = [...document.body.children].filter((element) => element !== viewer)
            .map((element) => [element, element.inert])
        background.forEach(([element]) => { element.inert = true })
        gallery.refreshOnResize()
    }, true)
    element.addEventListener("lgBeforeClose", restore)
    gallery.openGallery()
    element.addEventListener("gallery:show-photo", ({ detail }) => {
        if (!Number.isInteger(detail?.index) || detail.index < 0 || detail.index >= data.length) return
        restore()
        gallery.slide(detail.index)
        element.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "start",
        })
    })
    return gallery
}
