const initGallery = (data) => {
    const element = document.getElementById("gallery")
    // load photos to gallery
    window.lightGallery(element, {
        plugins: [lgZoom, lgAutoplay].concat(data.length < 50 ? [lgThumbnail] : []),
        container: element,
        dynamic: true,
        dynamicEl: data.map((item) => {
            return {
                src: item.src,
                thumb: item.src,
                subHtml: "<br>".repeat(4) + item.loc,
            }
        }),
        mode: "lg-zoom-in-out",
        closable: false,
        slideShowAutoPlay: false
    }).openGallery()
    // insert exif info
    element.addEventListener("lgAfterSlide", () => {
        const image = document.querySelector(".lg-container.lg-show .lg-current img")
        const caption = document.querySelector(".lg-container.lg-show .lg-sub-html")
        window.exifr.parse(image).then((exif) => {
            caption.innerHTML = ((exif !== undefined) ? [
                (exif.Model ?? "") || null,
                (exif.LensModel ?? "") || null,
                ((exif) => [
                    ((f) => (f === undefined) ? null : `f/${f.toFixed(1)}`)(exif.FNumber),
                    ((e) => (e === undefined) ? null : (e < 1) ? `1/${Math.floor(1 / e)}s` : `${e}s`)(exif.ExposureTime),
                    ((iso) => (iso === undefined) ? null : `ISO${iso}`)(exif.ISOSpeed ?? exif.ISO),
                ].filter((item) => item !== null).join(" "))(exif) || null,
                (exif.DateTimeOriginal ?? "").toLocaleString() || null,
            ] : []).concat([
                caption.innerText.trim() || null
            ]).filter((item) => item !== null).join("<br>")
        })
    })
    // activate maximize button
    document.getElementById("gallery-btn").toggleAttribute("active", true)
}

const toggleGallery = () => {
    const element = document.getElementById("gallery")
    if (element.hasAttribute("maximized")) {
        element.toggleAttribute("maximized", false)
        element.style.setProperty("position", "relative")
        document.documentElement.toggleAttribute("fullscreen", false)
        window.scrollTo({ top: element.offsetTop - (window.innerHeight - element.offsetHeight) / 2 })
    } else {
        element.toggleAttribute("maximized", true)
        element.style.removeProperty("position")
        document.documentElement.toggleAttribute("fullscreen", true)
        window.scrollTo({ top: 0 })
    }
}
