const initGallery = (id, data) => {
    const element = document.getElementById(id)
    // load photos to gallery
    window.lightGallery(element, {
        plugins: [lgZoom, lgAutoplay, lgThumbnail],
        container: element,
        dynamic: true,
        dynamicEl: data.map((item) => {
            return {
                src: item.src,
                thumb: item.src,
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
                caption.innerText.trim() ? caption.children[caption.childElementCount - 1].outerHTML : null
            ]).filter((item) => item !== null).join("<br>")
        })
    })
}
