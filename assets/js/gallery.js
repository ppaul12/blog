---
---

const initGallery = (id, data, { openOnInit = true, inline = true, closable = !inline, showMaximizeIcon = inline } = {}) => {
    const element = document.getElementById(id)
    // load photos to gallery
    const gallery = window.lightGallery(element, {
        plugins: [lgZoom, lgAutoplay, lgThumbnail],
        ...(inline ? { container: element } : {}),
        dynamic: true,
        dynamicEl: data.map((item) => {
            return {
                src: `{{ site.baseurl }}${item.src}`,
                thumb: `{{ site.baseurl }}${item.src}`,
                subHtml: "<br>".repeat(4) + ((item.link !== undefined) ?
                    `<a href="${item.link}">${item.loc}</a>` : `<span>${item.loc}</span>`),
            }
        }),
        mode: "lg-zoom-in-out",
        closable,
        // Use explicit navigation instead of gestures, including on touch devices.
        enableDrag: false,
        enableSwipe: false,
        keyPress: false,
        hideBarsDelay: 0,
        mobileSettings: {
            controls: true,
            showCloseIcon: closable,
            download: false,
            showGestureButtons: false
        },
        thumbnail: data.length < 50,
        thumbWidth: inline ? 88 : 100,
        thumbHeight: "var(--gallery-thumb-height)",
        slideShowAutoPlay: false,
        showMaximizeIcon
    })
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
    if (inline && showMaximizeIcon) {
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
    }
    if (openOnInit) gallery.openGallery()
    element.addEventListener("gallery:show-photo", ({ detail }) => {
        if (!Number.isInteger(detail?.index) || detail.index < 0 || detail.index >= data.length) return
        restore()
        gallery.slide(detail.index)
        element.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            block: "start",
        })
    })
    // insert exif info
    element.addEventListener("lgAfterSlide", () => {
        const image = document.querySelector(".lg-container.lg-show .lg-current img")
        const caption = document.querySelector(".lg-container.lg-show .lg-sub-html")
        if (!image || !caption || !window.exifr) return
        window.exifr.parse(image).then((exif) => {
            const formatCaption = (caption, exif) => {
                if (exif === undefined) return caption
                if (!exif.GPSLatitude || !exif.GPSLongitude) return caption

                const dms2decimal = ([degrees, minutes, seconds], ref) => {
                    let decimal = degrees + minutes / 60 + seconds / 3600
                    return (ref === "W" || ref === "S") ? -decimal : decimal
                }
                const lat = dms2decimal(exif.GPSLatitude, exif.GPSLatitudeRef)
                const lon = dms2decimal(exif.GPSLongitude, exif.GPSLongitudeRef)
                const link = `https://www.google.com/maps?q=${lat},${lon}`
                return `<a href="${link}" target="_blank" rel="noopener noreferrer">${caption || '📍 (Google Map)'}</a>`
            }
            caption.innerHTML = ((exif !== undefined) ? [
                (exif.Model ?? "") || null,
                (exif.LensModel ?? "") || null,
                [
                    ((f) => (f === undefined) ? null : `f/${f.toFixed(1)}`)(exif.FNumber),
                    ((e) => (e === undefined) ? null : (e < 1) ? `1/${Math.floor(1 / e)}s` : `${e}s`)(exif.ExposureTime),
                    ((iso) => (iso === undefined) ? null : `ISO${iso}`)(exif.ISOSpeed ?? exif.ISO)
                ].filter((item) => item !== null).join(" ") || null,
                (exif.DateTimeOriginal ?? "").toLocaleString() || null,
            ] : []).concat([
                formatCaption(caption.innerText.trim() ? caption.children[caption.childElementCount - 1].outerHTML : null, exif)
            ]).filter((item) => item !== null).join("<br>")
        })
    })
    return gallery
}
