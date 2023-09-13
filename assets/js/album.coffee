---
---

# init album

shuffled = (array) ->
    currentIdx = array.length
    while currentIdx > 0
        targetIdx = Math.floor(Math.random() * currentIdx)
        currentIdx--
        [array[currentIdx], array[targetIdx]] = [array[targetIdx], array[currentIdx]]
    array

maximize = () ->
    album = document.getElementById("album")
    if album.hasAttribute("maximized")
        album.removeAttribute("maximized")
        album.style.setProperty("position", "relative")
        document.querySelector(".lg-progress-bar").style.setProperty("display", "none")
        document.documentElement.style.removeProperty("overflow")
        window.scrollTo({top: album.offsetTop - (window.innerHeight - album.offsetHeight) / 2})
    else
        album.setAttribute("maximized", '')
        album.style.removeProperty("position")
        document.querySelector(".lg-progress-bar").style.removeProperty("display")
        document.documentElement.style.setProperty("overflow", "hidden")
        window.scrollTo({top: 0})
    return

getHexColor = (image) ->
    thief = new ColorThief()
    thief.getColor(image).reduce(
        (hex, color) -> hex + color.toString(16)
    , "#")

window.addEventListener("load", () ->
    album = document.getElementById("album")
    album.addEventListener("lgAfterSlide", (e) ->
        color = getHexColor(document.querySelector(".lg-current img"))
        document.querySelector(".lg-backdrop").style.setProperty(
            "background",
            "radial-gradient(#{color}, black 80%)"
        )
        return
    )
    # load photos
    fetch("/assets/json/album.json").then((response) -> response.json()).then((data) ->
        window.lightGallery(album, {
            plugins: [lgZoom, lgAutoplay]
            container: album
            dynamic: true
            dynamicEl: ({
                src: pic.path
                subHtml: "<a href=\"#{pic.url}\">#{pic.info}</a>"
            } for pic in shuffled(data))
            mode: "lg-zoom-in-out"
            closable: false
            slideShowAutoplay: true
        }).openGallery()
        window.scrollTo({top: album.offsetTop - (window.innerHeight - album.offsetHeight) / 2})
        document.querySelector(".lg-progress-bar").style.setProperty("display", "none")
        return
    )
    # generate maximize button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.onclick = maximize
    button.innerHTML = "<i class=\"fa-solid fa-maximize faa-pulse faa-fast\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return
)
