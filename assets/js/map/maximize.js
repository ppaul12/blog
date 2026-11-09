const mapMaximizeControls = new WeakMap()
let activeMapMaximizeControl

// A body-level viewer keeps the article's layout and the browser's fullscreen mode intact.
const addMapMaximizeControl = (map) => {
    const container = map.getContainer()
    let button, icon, viewer, placeholder, scrollPosition, resizeObserver, afterRestore
    let background = []
    let resizeFrame
    const resize = () => {
        cancelAnimationFrame(resizeFrame)
        resizeFrame = requestAnimationFrame(() => map.invalidateSize({ animate: false }))
    }
    const updateButton = () => {
        const label = viewer ? "Restore map" : "Maximize map"
        button.title = label
        button.setAttribute("aria-label", label)
        button.setAttribute("aria-expanded", String(Boolean(viewer)))
        icon.className = `fa-solid ${viewer ? "fa-compress" : "fa-expand"}`
    }
    const restore = () => {
        if (!viewer) return
        resizeObserver.disconnect()
        placeholder.replaceWith(container)
        viewer.remove()
        viewer = undefined
        background.forEach(([element, inert]) => { element.inert = inert })
        background = []
        activeMapMaximizeControl = undefined
        updateButton()
        window.scrollTo({ ...scrollPosition, behavior: "instant" })
        resize()
        const callback = afterRestore
        afterRestore = undefined
        callback?.()
    }
    const close = (onClose) => {
        if (!viewer) {
            onClose?.()
            return
        }
        if (onClose) afterRestore = onClose
        if (viewer.classList.contains("is-closing")) return
        viewer.addEventListener("animationend", (event) => {
            if (event.target === viewer && event.animationName === "map-maximize-out") restore()
        })
        viewer.classList.add("is-closing")
    }
    const open = () => {
        if (viewer) return
        activeMapMaximizeControl?.restore()
        scrollPosition = { left: window.scrollX, top: window.scrollY }
        const style = getComputedStyle(container)
        placeholder = document.createElement("div")
        placeholder.className = "map-maximize-placeholder"
        placeholder.setAttribute("aria-hidden", "true")
        Object.assign(placeholder.style, {
            height: `${container.getBoundingClientRect().height}px`,
            margin: style.margin,
        })
        container.before(placeholder)
        viewer = document.createElement("div")
        viewer.className = "map-maximized-overlay"
        viewer.setAttribute("role", "dialog")
        viewer.setAttribute("aria-modal", "true")
        viewer.setAttribute("aria-label", "Expanded map")
        document.body.append(viewer)
        viewer.append(container)
        // Make the background noninteractive without changing its overflow or positioning.
        background = [...document.body.children].filter((element) => element !== viewer)
            .map((element) => [element, element.inert])
        background.forEach(([element]) => { element.inert = true })
        activeMapMaximizeControl = controller
        updateButton()
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(viewer)
        resize()
    }
    const controller = { open, close, restore }
    const Control = L.Control.extend({
        options: { position: "topleft" },
        onAdd() {
            const bar = L.DomUtil.create("div", "leaflet-bar")
            button = L.DomUtil.create("button", "map-maximize-button", bar)
            button.type = "button"
            button.setAttribute("aria-controls", container.id)
            icon = createMapIcon("expand")
            button.append(icon)
            updateButton()
            L.DomEvent.disableClickPropagation(bar)
            L.DomEvent.disableScrollPropagation(bar)
            button.addEventListener("click", () => viewer ? close() : open())
            return bar
        },
        onRemove() {
            restore()
            cancelAnimationFrame(resizeFrame)
            mapMaximizeControls.delete(map)
        },
    })
    new Control().addTo(map)
    mapMaximizeControls.set(map, controller)
    return controller
}

