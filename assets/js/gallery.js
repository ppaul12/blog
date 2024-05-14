const initGallery = (data) => {
    const gallery = document.getElementById("gallery")
    // load photos to gallery
    const plugins = [lgZoom, lgAutoplay]
    if (data.length < 50) {
        plugins.push(lgThumbnail)
    }
    window.lightGallery(gallery, {
        plugins: plugins,
        container: gallery,
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
    gallery.addEventListener("lgAfterSlide", () => {
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
    document.getElementById("gallery-btn").setAttribute("active", "")
}

const maximizeGallery = () => {
    const gallery = document.getElementById("gallery")
    if (gallery.hasAttribute("maximized")) {
        gallery.removeAttribute("maximized")
        gallery.style.setProperty("position", "relative")
        document.documentElement.removeAttribute("fullscreen")
        window.scrollTo({ top: gallery.offsetTop - (window.innerHeight - gallery.offsetHeight) / 2 })
    } else {
        gallery.setAttribute("maximized", "")
        gallery.style.removeProperty("position")
        document.documentElement.setAttribute("fullscreen", "")
        window.scrollTo({ top: 0 })
    }
}
