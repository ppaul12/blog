const addMapPhotoLocations = (map, layersControl, galleries) => {
    if (galleries.length === 0 || typeof photoMetadata === "undefined") return
    // Register the overlay without adding it to the map or reading image metadata yet.
    const photos = L.featureGroup()
    layersControl.addOverlay(photos, "📷")
    const status = L.control({ position: "bottomright" })
    const message = L.DomUtil.create("div", "map-photo-status")
    message.setAttribute("role", "status")
    status.onAdd = () => message
    let disposed = false
    let photoLoad

    const loadPhotos = async () => {
        const collections = await Promise.all(galleries.map(async (gallery) => ({
            gallery,
            items: await photoMetadata.loadPhotos(gallery.dataset.gallerySource),
        })))
        const items = collections.flatMap(({ gallery, items }) => {
            return items.map((item, galleryIndex) => ({ ...item, gallery, galleryIndex }))
        })
        const locations = new Map()
        // Limit concurrent EXIF requests, especially for long photo collections.
        for (let offset = 0; offset < items.length; offset += 4) {
            const batch = await Promise.all(items.slice(offset, offset + 4).map(async (item) => {
                try {
                    const { latitude, longitude } = await photoMetadata.get(item)
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
                        || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
                    return { ...item, src: photoMetadata.resolveURL(item.src), latitude, longitude }
                } catch (error) {
                    console.warn(`Unable to read photo GPS: ${item.src}`, error)
                    return null
                }
            }))
            batch.filter(Boolean).forEach((item) => {
                const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`
                if (!locations.has(key)) locations.set(key, [])
                locations.get(key).push(item)
            })
        }
        if (disposed) return
        locations.forEach((items) => {
            const label = `${items[0].loc || "📷"} (${items.length})`
            const icon = document.createElement("span")
            icon.setAttribute("aria-label", label)
            icon.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6l2-3h4l2 3h3a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="4"/></svg>'
            const marker = L.marker([items[0].latitude, items[0].longitude], {
                title: label,
                icon: L.divIcon({
                    className: "map-photo-icon", html: icon,
                    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15],
                }),
            })
            marker.bindPopup(() => {
                const content = document.createElement("div")
                content.className = "map-photo-popup"
                items.forEach((item) => {
                    const button = document.createElement("button")
                    button.type = "button"
                    button.addEventListener("click", () => {
                        const gallery = item.gallery
                        if (!gallery.isConnected) return
                        map.closePopup()
                        mapMaximizeControls.get(map)?.restore()
                        gallery.dispatchEvent(new CustomEvent("gallery:show-photo", {
                            detail: { index: item.galleryIndex },
                        }))
                    })
                    const image = document.createElement("img")
                    const previewURL = new URL(item.src, window.location.href)
                    previewURL.searchParams.set("map-preview", "1")
                    image.src = previewURL.href
                    image.alt = item.loc || "📷"
                    image.loading = "lazy"
                    const caption = document.createElement("span")
                    caption.textContent = item.loc || "📷"
                    button.append(image, caption)
                    content.append(button)
                })
                return content
            }, {
                maxWidth: Math.min(240, map.getSize().x - 140), minWidth: 140,
                autoPanPaddingBottomRight: [Math.min(100, map.getSize().x / 5), 10],
                closeButton: false,
            })
            photos.addLayer(marker)
        })
    }

    const onOverlayAdd = async ({ layer }) => {
        if (layer !== photos) return
        message.textContent = "Loading photo GPS …"
        status.addTo(map)
        try {
            await (photoLoad ??= loadPhotos())
            if (disposed || !map.hasLayer(photos)) return
            const photoBounds = photos.getBounds()
            if (photoBounds.isValid()) {
                status.remove()
                map.fitBounds(photoBounds, { padding: [40, 40], maxZoom: 14 })
            } else message.textContent = "No GPS info available."
        } catch (error) {
            photoLoad = undefined
            console.warn("Unable to load photo locations", error)
            if (!disposed && map.hasLayer(photos)) message.textContent = "Unable to load photo locations."
        }
    }
    const onOverlayRemove = ({ layer }) => {
        if (layer === photos) status.remove()
    }
    map.on("overlayadd", onOverlayAdd)
    map.on("overlayremove", onOverlayRemove)
    return () => {
        disposed = true
        map.off("overlayadd", onOverlayAdd)
        map.off("overlayremove", onOverlayRemove)
        status.remove()
    }
}

