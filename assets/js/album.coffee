---
---

shuffled = (array) ->
    currentIdx = array.length
    while currentIdx > 0
        targetIdx = Math.floor(Math.random() * currentIdx)
        currentIdx--
        [array[currentIdx], array[targetIdx]] = [array[targetIdx], array[currentIdx]]
    return array

openAlbum = (event) ->
    # remove unused containers
    container.remove() for container in document.getElementsByClassName("lg-container")
    # load photo info
    fetch("/assets/json/album.json").then((response) -> response.json()).then((data) ->
        window.lightGallery(document.documentElement, {
            plugins: [lgZoom, lgFullscreen, lgAutoplay]
            dynamic: true
            dynamicEl: ({
                src: pic.path
                subHtml: "<a href=\"#{pic.url}\">#{pic.info}</a>"
            } for pic in shuffled(data))
            hideScrollbar: true
            slideShowAutoplay: true
        }).openGallery()
        return
    )
    return

window.openAlbum = openAlbum
