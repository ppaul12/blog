---
---

const initLightbox = (id, data, {
    autoplay = false, loop = true, resetScrollPosition = true, titleFallback = "null",
} = {}) => {
    const element = document.getElementById(id)
    let photos = data, lightbox
    let syncInfoPanel = () => {}
    const panelId = `lightbox-photo-info-${id}`
    // Use lightGallery's icon API so paired controls keep their native state changes.
    const icons = Object.fromEntries(Object.entries({
        close: "xmark", prev: "arrow-left", next: "arrow-right", download: "download",
        more: "ellipsis-vertical", zoomIn: "magnifying-glass-plus", zoomOut: "magnifying-glass-minus",
        autoplayPlay: "play", autoplayPause: "pause", toggleThumbnails: "images",
    }).map(([name, icon]) => [name, `<i class="fa-solid fa-${icon}" aria-hidden="true"></i>`]))
    const caption = (photo, metadata = photo.exif) => {
        const wrapper = document.createElement("div")
        wrapper.className = "lightbox-photo-caption"
        const title = photoMetadata.renderLocation(
            photo.lightboxLink ? { ...photo, link: photo.lightboxLink } : photo,
            metadata, photo.lightboxCaption || photo.loc || photo.caption || titleFallback,
        )
        title.className = "lightbox-photo-title"
        title.title = title.textContent
        const values = photoMetadata.format(metadata)
        // Location, camera and camera-local date remain visible when details are closed.
        const summary = document.createElement("div")
        summary.className = "lightbox-photo-summary"
        const camera = document.createElement("span")
        camera.className = "lightbox-photo-camera"
        camera.textContent = values.camera
        const date = document.createElement("span")
        date.className = "lightbox-photo-date"
        date.textContent = values.date
        summary.append(title, camera, date)
        const panel = document.createElement("section")
        panel.id = panelId
        panel.className = "lightbox-photo-panel"
        panel.setAttribute("aria-label", "Photo details")
        const lens = document.createElement("dl")
        lens.className = "lightbox-photo-lens"
        const lensLabel = document.createElement("dt")
        lensLabel.textContent = "Lens"
        const lensValue = document.createElement("dd")
        lensValue.textContent = values.lens
        lens.append(lensLabel, lensValue)
        const parameters = document.createElement("dl")
        parameters.className = "lightbox-photo-parameters"
        for (const [label, key, tooltip] of photoMetadata.parameters) {
            const cell = document.createElement("div")
            const term = document.createElement("dt")
            term.textContent = label
            if (tooltip) term.title = tooltip
            const value = document.createElement("dd")
            if (key === "metering") value.append(photoMetadata.renderMetering(values))
            else value.textContent = values[key]
            cell.append(term, value)
            parameters.append(cell)
        }
        panel.append(lens, parameters)
        const shell = document.createElement("div")
        shell.className = "lightbox-photo-panel-shell"
        const clip = document.createElement("div")
        clip.className = "lightbox-photo-panel-clip"
        clip.append(panel)
        shell.append(clip)
        wrapper.append(summary, shell)
        return wrapper
    }
    const galleryItems = (items) => items.map((photo) => ({
        src: photoMetadata.resolveURL(photo.src),
        thumb: photoMetadata.resolveURL(photo.thumb || photo.preview || photo.src),
        alt: photo.alt || photoMetadata.heading(photo, titleFallback),
        subHtml: caption(photo).outerHTML,
    }))
    const updateCaption = async (index) => {
        const photo = photos[index]
        if (!photo) return
        const metadata = await photoMetadata.get(photo)
        // Both album filters and fast slide changes can invalidate an in-flight read.
        if (photos[index] !== photo || !lightbox?.lgOpened || lightbox.index !== index) return
        const content = caption(photo, metadata)
        lightbox.galleryItems[index].subHtml = content.outerHTML
        const target = lightbox.outer.get().querySelector(".lg-sub-html")
        if (target) {
            target.replaceChildren(content)
            syncInfoPanel()
        }
    }
    element.addEventListener("lgAfterOpen", () => updateCaption(lightbox.index))
    element.addEventListener("lgAfterSlide", ({ detail }) => updateCaption(detail.index))
    lightbox = window.lightGallery(element, {
        icons,
        plugins: [lgZoom, ...(autoplay ? [lgAutoplay] : []), lgThumbnail],
        dynamic: true,
        dynamicEl: galleryItems(photos),
        closable: true,
        enableDrag: true,
        enableSwipe: true,
        keyPress: true,
        hideBarsDelay: 0,
        mobileSettings: {
            controls: true,
            enableSwipe: true,
            showCloseIcon: true,
            download: false,
            showGestureButtons: false,
        },
        thumbnail: photos.length < 50,
        thumbWidth: 100,
        thumbHeight: "var(--lightbox-thumb-height)",
        autoplay,
        autoplayControls: autoplay,
        slideShowAutoplay: false,
        loop, resetScrollPosition,
    })
    const outer = lightbox.outer.get()
    const toggle = document.createElement("button")
    toggle.type = "button"
    toggle.className = "lg-icon lightbox-info-toggle"
    toggle.setAttribute("aria-controls", panelId)
    toggle.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>'
    syncInfoPanel = () => {
        const expanded = outer.classList.contains("lg-photo-info-open")
        outer.querySelectorAll(".lightbox-photo-panel").forEach((panel) => {
            panel.toggleAttribute("inert", !expanded)
            panel.setAttribute("aria-hidden", String(!expanded))
        })
    }
    const setExpanded = (expanded) => {
        outer.classList.toggle("lg-photo-info-open", expanded)
        toggle.setAttribute("aria-expanded", String(expanded))
        toggle.setAttribute("aria-label", expanded ? "Hide photo details" : "Show photo details")
        toggle.title = expanded ? "Hide photo details" : "Show photo details"
        syncInfoPanel()
    }
    toggle.addEventListener("click", (event) => {
        event.stopPropagation()
        setExpanded(toggle.getAttribute("aria-expanded") !== "true")
    })
    outer.querySelector(".lg-toolbar").append(toggle)
    setExpanded(false)
    // Caption replacement and slide changes leave this viewer-level state intact.
    // Each viewing session starts collapsed; slide changes preserve the current choice.
    element.addEventListener("lgAfterClose", () => setExpanded(false))
    element.addEventListener("lgAfterAppendSubHtml", syncInfoPanel)
    // Keep zoom measurements in sync when the panel or asynchronous metadata changes height.
    const observer = new ResizeObserver(() => lightbox.refreshOnResize())
    observer.observe(outer.querySelector(".lg-content"))
    lightbox.setPhotos = (items) => {
        photos = items
        lightbox.refresh(galleryItems(items))
    }
    return lightbox
}
