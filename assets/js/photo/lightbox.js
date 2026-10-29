---
---

const initLightbox = (id, data, { inline = false, closable = !inline, showMaximizeIcon = inline } = {}) => {
    const element = document.getElementById(id)
    const galleryItems = (photos) => photos.map((item) => {
        const caption = document.createElement(item.link !== undefined ? "a" : "span")
        caption.textContent = item.caption ?? item.loc ?? ""
        if (item.link !== undefined) caption.setAttribute("href", item.link)
        return {
            src: `{{ site.baseurl }}${item.src}`,
            thumb: `{{ site.baseurl }}${item.src}`,
            subHtml: "<br>".repeat(4) + caption.outerHTML,
        }
    })
    // Populate the shared large-image viewer.
    const lightbox = window.lightGallery(element, {
        plugins: [lgZoom, lgAutoplay, lgThumbnail],
        ...(inline ? { container: element } : {}),
        dynamic: true,
        dynamicEl: galleryItems(data),
        mode: "lg-zoom-in-out",
        closable,
        // Use explicit navigation instead of gestures, including on touch devices.
        enableDrag: false,
        enableSwipe: false,
        keyPress: true,
        hideBarsDelay: 0,
        mobileSettings: {
            controls: true,
            enableSwipe: true,
            showCloseIcon: closable,
            download: false,
            showGestureButtons: false
        },
        thumbnail: data.length < 50,
        thumbWidth: inline ? 88 : 100,
        thumbHeight: "var(--lightbox-thumb-height)",
        slideShowAutoPlay: false,
        showMaximizeIcon
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
    lightbox.setPhotos = (photos) => lightbox.refresh(galleryItems(photos))
    return lightbox
}
