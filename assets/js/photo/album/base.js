// Shared album cards and lightbox; collection/timeline own ordering and grouping.
const initAlbum = (id, photos, baseURL = "") => {
    const element = document.getElementById(id)
    // Resolve display text once so thumbnails and large images agree.
    const items = photos.map((photo) => ({ ...photo, caption: photo.caption ?? photo.loc ?? "" }))
    const lightbox = initLightbox(id, items)
    let refreshTimer
    const refreshAOS = () => {
        if (typeof AOS === "undefined") return
        clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => AOS.refresh(), 200)
    }
    // Container resizing and image loads can move animation anchors.
    const observer = new ResizeObserver(refreshAOS)
    observer.observe(element)

    const createCard = (index, {
        label = `Open photo: ${items[index].caption}`,
        className = "",
    } = {}) => {
        const photo = items[index]
        const caption = photo.caption
        const card = document.createElement("button")
        card.type = "button"
        card.className = `album-card${className ? ` ${className}` : ""}`
        card.dataset.aos = "fade"
        card.dataset.aosDuration = 600
        card.setAttribute("aria-label", label)
        card.addEventListener("click", () => lightbox.openGallery(index))

        const image = document.createElement("img")
        image.alt = caption || "Album photo"
        image.loading = "lazy"
        image.decoding = "async"
        const setRatio = (width, height) => {
            const ratio = Number(width) / Number(height)
            if (Number.isFinite(ratio) && ratio > 0) {
                card.style.setProperty("--album-ratio", ratio)
            }
        }
        setRatio(photo.width, photo.height)
        image.addEventListener("load", () => {
            setRatio(image.naturalWidth, image.naturalHeight)
            refreshAOS()
        }, { once: true })
        image.src = `${baseURL}${photo.src}`

        const text = document.createElement("span")
        text.className = "album-caption"
        text.textContent = caption
        card.append(image, text)
        return card
    }
    return { createCard }
}
