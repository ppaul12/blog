const resolveMapAssetURL = (url, baseURL = "") => {
    return url.startsWith("/") && !url.startsWith("//") ? `${baseURL}${url}` : url
}

const createMapLocationMarker = (name, coordinates, options = {}) => {
    const popup = document.createElement("span")
    popup.textContent = name
    return L.marker(coordinates, { title: name, alt: name, ...options })
        .bindPopup(popup, { closeButton: false })
}

const loadMapTracks = async (trackURLs = [], baseURL = "", color = "#d65a31") => {
    // Keep files and GPX track segments separate, including gaps between recordings.
    const trackLayers = await Promise.all(trackURLs.map(async (url) => {
        try {
            const response = await fetch(resolveMapAssetURL(url, baseURL))
            if (!response.ok) throw new Error(`GPX HTTP ${response.status}`)
            const xml = new DOMParser().parseFromString(await response.text(), "application/xml")
            if (xml.querySelector("parsererror")) throw new Error("Invalid GPX")
            const lines = Array.from(xml.getElementsByTagNameNS("*", "trkseg"), (segment) => {
                const points = Array.from(segment.getElementsByTagNameNS("*", "trkpt"), (point) => [
                    Number(point.getAttribute("lat")), Number(point.getAttribute("lon")),
                ]).filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
                if (points.length < 2) return null
                return L.polyline(points, {
                    color, weight: 4, opacity: 0.85,
                    interactive: false,
                })
            }).filter(Boolean)
            return L.featureGroup(lines)
        } catch (error) {
            console.warn(`Unable to load track: ${url}`, error)
            return null
        }
    }))
    return L.featureGroup(trackLayers.filter(Boolean))
}

const createMapControlGroup = (layersControl, title, className = "") => {
    const group = L.DomUtil.create("fieldset", `map-control-group ${className}`.trim())
    const legend = document.createElement("legend")
    legend.textContent = title
    group.append(legend)
    L.DomEvent.disableClickPropagation(group)
    L.DomEvent.disableScrollPropagation(group)
    group.addEventListener("keydown", (event) => event.stopPropagation())
    layersControl.getContainer().querySelector(".leaflet-control-layers-list").append(group)
    return group
}

const addMapTrackSelector = (map, layersControl, tracks) => {
    if (tracks.length === 0) return
    const selector = createMapControlGroup(layersControl, "Tracks", "map-tracks")
    tracks.forEach(({ type, layer, color }) => {
        const label = document.createElement("label")
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = map.hasLayer(layer)
        checkbox.style.setProperty("--map-track-color", color)
        checkbox.setAttribute("aria-controls", map.getContainer().id)
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) layer.addTo(map)
            else map.removeLayer(layer)
        })
        label.append(checkbox, document.createTextNode(` ${type}`))
        selector.append(label)
    })
}

const addMapPhotoLocations = (map, layersControl, galleries, baseURL = "") => {
    if (galleries.length === 0 || !window.exifr) return
    // Register the overlay without adding it to the map or reading image metadata yet.
    const photos = L.featureGroup()
    layersControl.addOverlay(photos, "📷")
    const status = L.control({ position: "bottomright" })
    const message = L.DomUtil.create("div", "map-photo-status")
    message.setAttribute("role", "status")
    status.onAdd = () => message
    let photoLoad

    const loadPhotos = async () => {
        const collections = await Promise.all(galleries.map(async (gallery) => ({
            gallery,
            items: await asyncLoadJSON(gallery.dataset.gallerySource),
        })))
        const items = collections.flatMap(({ gallery, items }) => {
            return items.map((item, galleryIndex) => ({ ...item, gallery, galleryIndex }))
        })
        const locations = new Map()
        // Limit concurrent EXIF requests, especially for long photo collections.
        for (let offset = 0; offset < items.length; offset += 4) {
            const batch = await Promise.all(items.slice(offset, offset + 4).map(async (item) => {
                try {
                    const src = resolveMapAssetURL(item.src, baseURL)
                    // Keep partial EXIF range responses out of the full image's cache entry.
                    const metadataURL = new URL(src, window.location.href)
                    metadataURL.searchParams.set("map-exif", "1")
                    const gps = await window.exifr.gps(metadataURL.href)
                    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)
                        || Math.abs(gps.latitude) > 90 || Math.abs(gps.longitude) > 180) return null
                    return { ...item, src, ...gps }
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
                        if (map.isFullscreen()) map.toggleFullscreen({ pseudoFullscreen: true })
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
                className: "map-photo-popup-container",
                closeButton: false,
            })
            photos.addLayer(marker)
        })
    }

    map.on("overlayadd", async ({ layer }) => {
        if (layer !== photos) return
        message.textContent = "Loading photo GPS …"
        status.addTo(map)
        try {
            await (photoLoad ??= loadPhotos())
            if (!map.hasLayer(photos)) return
            const photoBounds = photos.getBounds()
            if (photoBounds.isValid()) {
                status.remove()
                map.fitBounds(photoBounds, { padding: [40, 40], maxZoom: 14 })
            } else message.textContent = "No GPS info available."
        } catch (error) {
            photoLoad = undefined
            console.warn("Unable to load photo locations", error)
            if (map.hasLayer(photos)) message.textContent = "Unable to load photo locations."
        }
    })
    map.on("overlayremove", ({ layer }) => {
        if (layer === photos) status.remove()
    })
}

const addMapSegmentSelector = (map, layersControl, { locations, segments, markers, bounds, overviewOptions }) => {
    if (segments.length === 0) return
    const mapId = map.getContainer().id
    let selectedBounds
    map.on("fullscreenchange", () => {
        if (selectedBounds) map.fitBounds(selectedBounds, { padding: [36, 36], maxZoom: 14 })
    })
    const selector = createMapControlGroup(layersControl, "Plans", "map-segments")
    const selectSegment = (selected) => {
        map.closePopup()
        markers.clearLayers()
        if (selected === -1) {
            selectedBounds = undefined
            Object.keys(locations).forEach((name) => markers.addLayer(createMapLocationMarker(name, locations[name])))
            map.fitBounds(bounds, overviewOptions)
            return
        }

        // A stop can be visited more than once, so keep every visit number at its marker.
        const visits = new Map()
        segments[selected].forEach((name, index) => {
            if (!visits.has(name)) visits.set(name, [])
            visits.get(name).push(index + 1)
        })
        visits.forEach((numbers, name) => {
            const content = document.createElement("span")
            const pin = new L.Icon.Default().createIcon()
            pin.className = "map-stop-pin"
            pin.removeAttribute("style")
            pin.alt = ""
            pin.setAttribute("aria-hidden", "true")
            const badge = document.createElement("span")
            badge.className = "map-stop-badge"
            badge.textContent = numbers.join("·")
            content.append(pin, badge)
            const label = `${name} (${numbers.map((number) => `#${number}`).join(", ")})`
            content.setAttribute("aria-label", label)
            const width = Math.max(25, badge.textContent.length * 7 + 8)
            const marker = createMapLocationMarker(name, locations[name], {
                title: label,
                alt: label,
                icon: L.divIcon({
                    className: "map-stop-icon",
                    html: content,
                    iconSize: [width, 41],
                    iconAnchor: [width / 2, 41],
                    popupAnchor: [0, -34],
                    tooltipAnchor: [0, -28],
                }),
            })
            marker.getPopup().getContent().textContent = label
            markers.addLayer(marker)
        })
        selectedBounds = L.latLngBounds(segments[selected].map((name) => locations[name]))
        map.fitBounds(selectedBounds, { padding: [36, 36], maxZoom: 14 })
    }

    const labels = ["🗺️", ...segments.map((_, index) => `§${index + 1}`)]
    labels.forEach((text, index) => {
        const label = document.createElement("label")
        const radio = document.createElement("input")
        radio.type = "radio"
        radio.name = `${mapId}-segment`
        radio.value = String(index - 1)
        radio.checked = index === 0
        radio.setAttribute("aria-controls", mapId)
        radio.addEventListener("change", () => {
            if (radio.checked) selectSegment(index - 1)
        })
        label.append(radio, document.createTextNode(` ${text}`))
        selector.append(label)
    })
}

// baseURL prefixes root-relative assets referenced in map and gallery data.
const initMap = async (mapId, mapData, baseURL = "") => {
    // Gallery elements can follow the map's inline initialization script in the page.
    if (document.readyState === "loading") {
        await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }))
    }
    const container = document.getElementById(mapId)
    try {
        if (!mapData?.spot || Object.keys(mapData.spot).length === 0) {
            throw new Error("No map locations.")
        }
    } catch (error) {
        console.warn("Unable to load map data", error)
        container.textContent = "Unable to load map."
        container.setAttribute("role", "alert")
        return
    }
    const map = L.map(mapId)
    const article = container.closest("article")
    map.on("fullscreenchange", () => {
        article?.toggleAttribute("data-immersive", map.isFullscreen())
    })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }).addTo(map)

    const locations = mapData.spot
    const markers = L.layerGroup(Object.entries(locations).map(([name, coordinates]) => {
        return createMapLocationMarker(name, coordinates)
    })).addTo(map)
    const trackColors = ["#d65a31", "#315fb5", "#8661ae", "#328060"]
    const tracks = (await Promise.all(Object.entries(mapData.track ?? {}).map(async ([type, urls], index) => {
        const color = trackColors[index % trackColors.length]
        const layer = await loadMapTracks(urls, baseURL, color)
        return { type, layer, color }
    }))).filter(({ layer }) => layer.getBounds().isValid())
    const trackBounds = L.featureGroup(tracks.map(({ layer }) => layer)).getBounds()
    const hasTracks = trackBounds.isValid()
    tracks.forEach(({ layer }) => layer.addTo(map))
    const layersControl = L.control.layers(null, {
        "📍": markers,
    }, { collapsed: false }).addTo(map)
    const galleries = Array.from((article || document).querySelectorAll("[data-gallery-source]"))
        .filter((gallery) => gallery.dataset.gallerySource?.trim())
    addMapPhotoLocations(map, layersControl, galleries, baseURL)
    // Keep Leaflet's native overlays together; their container survives control updates.
    const spots = layersControl.getContainer().querySelector(".leaflet-control-layers-overlays")
    createMapControlGroup(layersControl, "Spots", "map-spots").append(spots)
    addMapTrackSelector(map, layersControl, tracks)

    const bounds = L.latLngBounds(Object.values(locations))
    if (hasTracks) bounds.extend(trackBounds)
    const maxZoom = map.getBoundsZoom(bounds)
    const overviewOptions = hasTracks
        ? { padding: [36, 36], maxZoom: 14 }
        : { maxZoom: maxZoom > 14 ? 14 : maxZoom > 7 ? maxZoom - 1 : maxZoom }
    map.fitBounds(bounds, overviewOptions)
    addMapSegmentSelector(map, layersControl, {
        locations, segments: mapData.path ?? [], markers, bounds, overviewOptions,
    })

    L.control.scale({
        position: "bottomright",
        imperial: false
    }).addTo(map)

    L.control.resetView({
        position: "topleft",
        latlng: map.getCenter(),
        zoom: map.getZoom(),
    }).addTo(map)

    new L.Control.Fullscreen({
        pseudoFullscreen: true,
    }).addTo(map)

    new L.Control.MiniMap(L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"), {
        position: "bottomleft",
        minimized: false,
    }).addTo(map)
}
