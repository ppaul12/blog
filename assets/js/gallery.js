---
---

const initGallery = (id, data, { openOnInit = true, inline = true, closable = !inline, showMaximizeIcon = inline } = {}) => {
    const element = document.getElementById(id)
    const article = element.closest("article")
    element.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest(".lg-maximize")) {
            const container = element.querySelector(".lg-container")
            article?.toggleAttribute("data-immersive", !container.classList.contains("lg-inline"))
        }
    })

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
    if (openOnInit) gallery.openGallery()
    element.addEventListener("gallery:show-photo", ({ detail }) => {
        if (!Number.isInteger(detail?.index) || detail.index < 0 || detail.index >= data.length) return
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
