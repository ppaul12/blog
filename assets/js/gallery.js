// init gallery event
function initGalleryEvent() {
    window.addEventListener("load", () => {
        document.querySelectorAll(".gallery img").forEach((img, idx) => {
            img.setAttribute('onclick', `location.href='${img.getAttribute('src')}'`)
        })
    })
}
