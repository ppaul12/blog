---
---

# init album

shuffled = (array) ->
    currentIdx = array.length
    while currentIdx > 0
        targetIdx = Math.floor(Math.random() * currentIdx--)
        [array[currentIdx], array[targetIdx]] = [array[targetIdx], array[currentIdx]]
    array

window.addEventListener("load", () ->
    album = document.getElementById("album")
    # add blurry background effect
    album.addEventListener("lgAfterSlide", (e) ->
        thief = new ColorThief()
        color = thief.getColor(document.querySelector(".lg-current img"))
        document.querySelector(".lg-backdrop.in").style.setProperty(
            "background",
            "radial-gradient(rgb(#{color.join(' ')}), black 80%)"
        )
        return
    )
    # load photos to album
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
        return
    )
    # generate maximize button
    button = document.createElement("button")
    button.className = "contrast faa-parent animated-hover"
    button.onclick = () ->
        album = document.getElementById("album")
        if album.hasAttribute("maximized")
            album.removeAttribute("maximized")
            album.style.setProperty("position", "relative")
            document.documentElement.style.removeProperty("overflow")
            window.scrollTo({top: album.offsetTop - (window.innerHeight - album.offsetHeight) / 2})
        else
            album.setAttribute("maximized", '')
            album.style.removeProperty("position")
            document.documentElement.style.setProperty("overflow", "hidden")
            window.scrollTo({top: 0})
        return
    button.innerHTML = "<i class=\"fa-solid fa-maximize faa-pulse faa-fast\"></i>"
    document.querySelector(".button-box").appendChild(button)
    return
)
