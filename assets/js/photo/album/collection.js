// Collection album: all photos, with URL-driven ordering.
const initCollectionAlbum = async (id, indexURL, baseURL = "") => {
    const element = document.getElementById(id)
    const albumCount = document.getElementById("collection-album-count")
    try {
        const orderInputs = [...document.querySelectorAll('input[name="collection-album-order"]')]
        const url = new URL(window.location)
        const currentOrder = ["shuffle", "ascend", "descend"].includes(url.searchParams.get("order")) ? url.searchParams.get("order") : "shuffle"
        orderInputs.forEach((input) => {
            input.checked = input.value === currentOrder
            input.addEventListener("change", () => {
                if (!input.checked) return
                url.searchParams.set("order", input.value)
                window.location.assign(url)
            })
        })

        const imageSets = await asyncLoadJSON(indexURL)
        const images = (await Promise.all(imageSets.map(async (imageSet) => {
            const entries = await asyncLoadJSON(imageSet.json)
            return entries.map((entry) => ({ ...entry, loc: imageSet.post, date: imageSet.date, link: imageSet.link }))
        }))).flat()
        const journeyCount = imageSets.filter((imageSet) => imageSet.journey).length
        const photoCount = document.createElement("span")
        photoCount.className = "collection-album-count-part"
        photoCount.textContent = `${images.length} photos`
        const journeyTotal = document.createElement("span")
        journeyTotal.className = "collection-album-count-part"
        journeyTotal.textContent = ` ${journeyCount} journeys`
        albumCount.replaceChildren(photoCount, document.createElement("wbr"), journeyTotal)
        if (images.length === 0) return

        switch (currentOrder) {
            case "ascend": images.sort((a, b) => a.date - b.date); break
            case "descend": images.sort((a, b) => b.date - a.date); break
            case "shuffle":
            default:
                for (let i = images.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    const image = images[i]
                    images[i] = images[j]
                    images[j] = image
                }
        }

        const album = initAlbum(id, images, baseURL)
        const fragment = document.createDocumentFragment()
        images.forEach((item, index) => {
            fragment.append(album.createCard(index, {
                label: `Open photo: ${item.loc}`,
            }))
        })
        element.append(fragment)
    } catch (error) {
        console.warn("Unable to initialize collection album", error)
        albumCount.textContent = "Unable to load photos. Please reload to try again."
    } finally {
        element.setAttribute("aria-busy", "false")
        if (typeof AOS !== "undefined") AOS.refreshHard()
    }
}
