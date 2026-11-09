// baseURL prefixes root-relative track assets referenced in map data.
const initTravelMap = async (mapId, mapData, baseURL = "") => {
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
    container.classList.add("travel-map")
    const view = createMapView(container)
    const { map } = view
    let disposePhotos
    try {
        const article = container.closest("article")
        const locations = mapData.spot
        const markers = L.layerGroup(Object.entries(locations).map(([name, coordinates]) => {
            return createMapLocationMarker(name, coordinates)
        })).addTo(map)
        const tracks = (await Promise.all(Object.entries(mapData.track ?? {}).map(async ([type, urls]) => {
            const color = mapTrackColor(type)
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
        disposePhotos = addMapPhotoLocations(map, layersControl, galleries)
        // Keep Leaflet's native overlays together; their container survives control updates.
        const spots = layersControl.getContainer().querySelector(".leaflet-control-layers-overlays")
        createMapControlGroup(layersControl, "Spots").append(spots)
        addMapTrackSelector(map, layersControl, tracks)

        const bounds = L.latLngBounds(Object.values(locations))
        if (hasTracks) bounds.extend(trackBounds)
        const maxZoom = map.getBoundsZoom(bounds)
        const overviewOptions = hasTracks
            ? { padding: [36, 36], maxZoom: 14 }
            : { maxZoom: maxZoom > 14 ? 14 : maxZoom > 7 ? maxZoom - 1 : maxZoom }
        view.setHomeView({ bounds, ...overviewOptions })
        addMapSegmentSelector(map, layersControl, {
            locations, segments: mapData.path ?? [], markers, bounds, overviewOptions,
        })

        return {
            ...view,
            destroy() {
                disposePhotos?.()
                view.destroy()
            },
        }
    } catch (error) {
        disposePhotos?.()
        view.destroy()
        throw error
    }
}
