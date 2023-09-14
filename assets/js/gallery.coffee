---
---

# generate popup gallery for gallery images

formatFNumber = (f) ->
    if not f?
        undefined
    else
        "f/#{f.toFixed(1)}"

formatExposure = (e) ->
    if not e?
        undefined
    else if e < 1
        "1/#{Math.floor(1 / e)}s"
    else
        "#{e}s"

formatISO = (iso) ->
    if not iso?
        undefined
    else
        "ISO#{iso}"

formatOpticalInfo = (exif) ->
    info = (value for value in [
        formatFNumber(exif?.FNumber),
        formatExposure(exif?.ExposureTime),
        formatISO(exif?.ISOSpeed ? exif?.ISO)
    ] when value?).join(" ")
    if info.length > 0 then info else undefined

formatLocation = (loc) ->
    if loc.length > 0 then loc else undefined

updateCaption = (img) ->
    cap = document.querySelector(".lg-container.lg-show .lg-sub-html")
    window.exifr.parse(img).then((exif) ->
        cap.innerHTML = (item for item in [
            exif?.Model,
            exif?.LensModel,
            formatOpticalInfo(exif),
            formatLocation(cap.innerText.trim()),
            exif?.DateTimeOriginal?.toLocaleString()
        ] when item?).join("<br>")
        return
    )

initGallery = (gallery, json) ->
    # load photos to gallery
    fetch(json).then((r) -> r.json()).then((items) ->
        window.lightGallery(gallery, {
            plugins: [lgThumbnail, lgZoom, lgAutoplay]
            container: gallery
            dynamic: true
            dynamicEl: ({
                src: item.src
                thumb: item.src
                subHtml: ("<br>" for i in [0...4]).join("") + item.loc
            } for item in items)
            mode: "lg-zoom-in-out"
            closable: false
            slideShowAutoPlay: false
        }).openGallery()
        return
    )
    # insert exif info
    gallery.addEventListener("lgAfterSlide", () ->
        updateCaption(document.querySelector(".lg-container.lg-show .lg-current img"))
    )
     # generate maximize button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.onclick = () ->
        if gallery.hasAttribute("maximized")
            gallery.removeAttribute("maximized")
            gallery.style.setProperty("position", "relative")
            document.documentElement.style.removeProperty("overflow")
            window.scrollTo({top: gallery.offsetTop - (window.innerHeight - gallery.offsetHeight) / 2})
        else
            gallery.setAttribute("maximized", '')
            gallery.style.removeProperty("position")
            document.documentElement.style.setProperty("overflow", "hidden")
            window.scrollTo({top: 0})
        return
    button.innerHTML = "<i class=\"fa-solid fa-maximize faa-pulse faa-fast\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return

window.initGallery = initGallery
