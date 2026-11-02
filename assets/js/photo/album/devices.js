// Cache SVG sources and mount a fresh copy each time a device page is entered.
(() => {
    const modal = document.getElementById("album-devices-modal")
    const button = document.getElementById("devices-btn")
    if (button) button.hidden = !modal
    if (!modal) return

    const book = modal.querySelector(".album-devices-book")
    const pages = [...book.querySelectorAll(".album-devices-page")]
    const visibilityThreshold = 0.6
    const sources = new Map()
    const visits = new Map()

    const loadSVG = async (url) => {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`SVG request failed: ${response.status}`)
        const documentSVG = new DOMParser().parseFromString(await response.text(), "image/svg+xml")
        const svg = documentSVG.documentElement
        if (svg.localName !== "svg" || documentSVG.querySelector("parsererror")) {
            throw new Error("Invalid device SVG")
        }
        return svg
    }

    const showIllustration = async (illustration) => {
        if (visits.has(illustration)) return
        const visit = Symbol()
        visits.set(illustration, visit)
        const url = illustration.dataset.deviceSvg
        try {
            if (!sources.has(url)) {
                sources.set(url, loadSVG(url))
            }
            const source = await sources.get(url)
            // Ignore a request that finishes after this visit has already ended.
            if (visits.get(illustration) !== visit) return
            const svg = document.importNode(source, true)
            // The device name is already displayed directly below the illustration.
            svg.setAttribute("aria-hidden", "true")
            svg.setAttribute("focusable", "false")
            illustration.replaceChildren(svg)
        } catch (error) {
            sources.delete(url)
            // Keep the original icon if the illustration cannot be loaded.
            console.warn("Unable to load device illustration", error)
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
            const illustration = target.querySelector("[data-device-svg]")
            if (!illustration) return
            if (modal.open && isIntersecting && intersectionRatio >= visibilityThreshold) {
                showIllustration(illustration)
            } else {
                visits.delete(illustration)
            }
        })
    }, { root: book, threshold: visibilityThreshold })

    const observePages = () => {
        observer.disconnect()
        visits.clear()
        if (modal.open) {
            pages.forEach((page) => observer.observe(page))
        }
    }

    new MutationObserver(observePages).observe(modal, { attributes: true, attributeFilter: ["open"] })
    observePages()
})()
