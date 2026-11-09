// Fit only the inner photo frame; Swiper's slide dimensions stay unchanged.
const fitGalleryPhoto = (width, height, availableWidth, availableHeight) => {
    if (!(availableWidth > 0 && availableHeight > 0)) return null
    if (!(Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0)) {
        return { width: availableWidth, height: availableHeight }
    }
    const scale = Math.min(availableWidth / width, availableHeight / height)
    return { width: width * scale, height: height * scale }
}

// Swiper owns page browsing; lightGallery opens only when a main photo is clicked.
const initGallery = (id, data) => {
    const element = document.getElementById(id)
    const photos = Array.isArray(data) ? data : []
    if (!element) return
    element.classList.add("travel-gallery")
    if (!photos.length) {
        element.textContent = "No photos yet."
        return
    }
    element.innerHTML = `
        <div class="travel-gallery-layout">
            <div class="travel-gallery-stage">
                <div class="travel-gallery-swiper swiper" role="region" aria-label="Travel photos">
                    <div class="swiper-wrapper" role="list"></div>
                </div>
                <p class="travel-gallery-count" role="status" aria-label="Photo count"></p>
            </div>
            <div class="travel-gallery-info">
                <div class="travel-gallery-description" aria-live="polite" aria-atomic="true">
                    <p class="travel-gallery-location" hidden></p>
                    <h3 class="travel-gallery-title"></h3>
                    <p class="travel-gallery-date"></p>
                    <dl class="travel-gallery-equipment">
                        <div><dt>Camera</dt><dd data-photo-field="camera"></dd></div>
                        <div><dt>Lens</dt><dd data-photo-field="lens"></dd></div>
                    </dl>
                    <dl class="travel-gallery-exposure">
                        ${photoMetadata.parameters.map(([label, key, title]) => `<div><dt${title ? ` title="${title}"` : ""}>${label}</dt><dd data-photo-field="${key}"></dd></div>`).join("")}
                    </dl>
                </div>
            </div>
        </div>`
    const track = element.querySelector(".swiper")
    const wrapper = element.querySelector(".swiper-wrapper")
    // The same CSS container query controls both stacking and carousel direction.
    const direction = () => getComputedStyle(track).getPropertyValue("--gallery-direction").trim()
    let currentIndex = -1, swiper, lightbox, viewerOpen = false, pendingMapIndex, scrollPosition
    let changingDirection = false
    const buttons = [], images = [], frames = []
    const fitFrame = (index) => {
        const button = buttons[index], image = images[index]
        if (!button || !image) return
        const failed = button.classList.contains("has-error")
        // clientWidth rounds fractional CSS pixels up on some layouts. Use the
        // untransformed layout size so a fitted landscape cannot overrun its slide.
        const bounds = getComputedStyle(button)
        const size = fitGalleryPhoto(
            failed ? null : (image.naturalWidth || Number(photos[index].width)),
            failed ? null : (image.naturalHeight || Number(photos[index].height)),
            parseFloat(bounds.width), parseFloat(bounds.height),
        )
        if (!size) return
        frames[index].style.width = `${size.width}px`
        frames[index].style.height = `${size.height}px`
    }
    const fitFrames = () => buttons.forEach((_, index) => fitFrame(index))
    const loadPhoto = (index) => {
        const image = images[index]
        if (image && !image.getAttribute("src")) {
            image.src = photoMetadata.resolveURL(photos[index].preview || photos[index].src)
        }
    }
    const showInfo = (index, metadata) => {
        if (currentIndex !== index) return
        const photo = photos[index]
        const values = photoMetadata.format(metadata)
        element.querySelector(".travel-gallery-title").textContent = photoMetadata.heading(photo)
        const location = element.querySelector(".travel-gallery-location")
        location.hidden = !(photo.title || photo.caption) || !photo.loc
        location.replaceChildren(photoMetadata.renderLocation(photo, metadata))
        element.querySelector(".travel-gallery-date").textContent = values.date
        element.querySelectorAll("[data-photo-field]").forEach((field) => {
            const key = field.dataset.photoField
            if (key === "metering") field.replaceChildren(photoMetadata.renderMetering(values))
            else field.textContent = values[key]
        })
    }
    const select = (index) => {
        if (currentIndex === index) return
        const photoHadFocus = buttons.includes(document.activeElement)
        currentIndex = index
        buttons.forEach((button, position) => {
            const active = position === index
            button.tabIndex = active ? 0 : -1
            button.classList.toggle("is-current", active)
            button.setAttribute("aria-label", active ? `Open photo: ${photoMetadata.heading(photos[position])}`
                : (position < index ? "Go to previous photo" : "Go to next photo"))
            button.closest(".swiper-slide").setAttribute("aria-hidden", String(Math.abs(position - index) > 1))
        })
        if (photoHadFocus && !viewerOpen) buttons[index].focus({ preventScroll: true })
        element.querySelector(".travel-gallery-count").textContent = `${index + 1} / ${photos.length}`
        for (const position of [index, index - 1, index + 1]) loadPhoto(position)
        showInfo(index, photos[index].exif)
        photoMetadata.get(photos[index]).then((metadata) => showInfo(index, metadata))
    }
    const navigate = (index, speed = 300) => {
        if (!Number.isInteger(index) || index < 0 || index >= photos.length) return
        if (swiper) swiper.slideTo(index, speed)
        select(index)
    }
    const openPhoto = (index) => {
        if (viewerOpen) return
        if (!lightbox) lightbox = initLightbox(id, photos, { loop: false, resetScrollPosition: false })
        scrollPosition = { left: window.scrollX, top: window.scrollY }
        lightbox.openGallery(index)
    }
    photos.forEach((photo, index) => {
        const slide = document.createElement("div")
        slide.className = "swiper-slide"
        const button = document.createElement("button")
        button.type = "button"
        button.className = "travel-gallery-photo"
        const frame = document.createElement("span")
        frame.className = "travel-gallery-frame"
        const image = document.createElement("img")
        const hint = document.createElement("span")
        hint.className = "photo-fullscreen-hint"
        hint.setAttribute("aria-hidden", "true")
        const showOpenIcon = () => {
            hint.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i>'
        }
        showOpenIcon()
        image.alt = photo.alt || photoMetadata.heading(photo)
        image.decoding = "async"
        image.draggable = false
        image.addEventListener("error", () => {
            image.hidden = true
            button.classList.add("has-error")
            hint.textContent = "Image unavailable · Retry"
            fitFrame(index)
        })
        image.addEventListener("load", () => {
            image.hidden = false
            button.classList.remove("has-error")
            showOpenIcon()
            fitFrame(index)
        })
        frame.append(image, hint)
        button.append(frame)
        button.addEventListener("click", (event) => {
            if (swiper && !swiper.allowClick) return
            // Empty space remains available for dragging, without opening the viewer.
            if (event.detail !== 0 && !event.target.closest(".travel-gallery-frame")) return
            if (index !== currentIndex) navigate(index)
            else if (button.classList.contains("has-error")) {
                image.removeAttribute("src")
                loadPhoto(index)
            } else openPhoto(index)
        })
        slide.append(button)
        wrapper.append(slide)
        buttons.push(button)
        images.push(image)
        frames.push(frame)
    })
    const start = () => {
        if (swiper) return
        swiper = new Swiper(track, {
            initialSlide: currentIndex,
            direction: direction(), slidesPerView: "auto", centeredSlides: true,
            spaceBetween: 16, loop: false, speed: 300, watchSlidesProgress: true,
            allowTouchMove: true, simulateTouch: true, touchStartPreventDefault: false,
            // A photo remains a keyboard-accessible button without blocking swipes when focused.
            focusableElements: "input, select, option, textarea, video, label",
            // Pico styles role=group as a form button group, including slide margins.
            a11y: { enabled: true, slideRole: "listitem", prevSlideMessage: "Previous photo", nextSlideMessage: "Next photo", scrollOnFocus: false },
            on: {
                slideChange(instance) { if (!changingDirection) select(instance.activeIndex) },
            },
        })
        swiper.slideTo(currentIndex, 0)
        fitFrames()
    }
    const syncDirection = () => {
        const axis = direction()
        const keys = axis === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"]
        track.setAttribute("aria-keyshortcuts", keys.join(" "))
        if (!swiper || swiper.params.direction === axis) return
        const index = currentIndex
        changingDirection = true
        swiper.changeDirection(axis, false)
        swiper.update()
        swiper.slideTo(index, 0)
        changingDirection = false
    }
    // Observe the gallery's width, rather than the viewport: posts can be narrow on desktop too.
    const resizeObserver = new ResizeObserver(() => {
        syncDirection()
        fitFrames()
    })
    resizeObserver.observe(element)
    resizeObserver.observe(track)
    syncDirection()
    element.addEventListener("keydown", (event) => {
        const keys = direction() === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"]
        if (viewerOpen || !keys.includes(event.key)
            || event.altKey || event.ctrlKey || event.metaKey) return
        event.preventDefault()
        navigate(currentIndex + (event.key === keys[0] ? -1 : 1))
        buttons[currentIndex].focus({ preventScroll: true })
    })
    element.addEventListener("lgBeforeOpen", () => { viewerOpen = true })
    element.addEventListener("lgAfterSlide", ({ detail }) => {
        if (viewerOpen && Number.isInteger(detail?.index)) navigate(detail.index, 0)
    })
    const showMapPhoto = (index) => {
        start()
        navigate(index, 0)
        element.scrollIntoView({ behavior: "smooth", block: "start" })
        buttons[index].focus({ preventScroll: true })
    }
    element.addEventListener("lgAfterClose", () => {
        viewerOpen = false
        // lightGallery restores its opening element after dispatching this event.
        queueMicrotask(() => {
            if (pendingMapIndex !== undefined) {
                const index = pendingMapIndex
                pendingMapIndex = undefined
                showMapPhoto(index)
            } else {
                if (scrollPosition) window.scrollTo({ ...scrollPosition, behavior: "instant" })
                buttons[currentIndex].focus({ preventScroll: true })
            }
        })
    })
    element.addEventListener("gallery:show-photo", ({ detail }) => {
        const index = detail?.index
        if (!Number.isInteger(index) || index < 0 || index >= photos.length) return
        if (viewerOpen) {
            const closing = pendingMapIndex !== undefined
            pendingMapIndex = index
            if (!closing) lightbox.closeGallery()
        } else showMapPhoto(index)
    })
    select(0)
    fitFrames()
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            start()
            observer.disconnect()
        }
    }, { rootMargin: "200px" })
    observer.observe(element)
    return { slide: navigate, openGallery: openPhoto }
}
