---
---

const initGallery = (id, data) => {
    const element = document.getElementById(id)
    const article = element.closest("article")
    element.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest(".lg-maximize")) {
            const container = element.querySelector(".lg-container")
            article?.toggleAttribute("data-immersive", !container.classList.contains("lg-inline"))
        }
    })

    // load photos to gallery
    window.lightGallery(element, {
        plugins: [lgZoom, lgAutoplay, lgThumbnail],
        container: element,
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
        closable: false,
        thumbnail: data.length < 50,
        slideShowAutoPlay: false,
        showMaximizeIcon: true
    }).openGallery()
    // insert exif info
    element.addEventListener("lgAfterSlide", () => {
        const image = document.querySelector(".lg-container.lg-show .lg-current img")
        const caption = document.querySelector(".lg-container.lg-show .lg-sub-html")
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
}
