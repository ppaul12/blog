const resolveMapAssetURL = (url, baseURL = "") => {
    return url.startsWith("/") && !url.startsWith("//") ? `${baseURL}${url}` : url
}

const createMapLocationMarker = (name, coordinates, options = {}) => {
    const popup = document.createElement("span")
    popup.textContent = name
    return L.marker(coordinates, { title: name, alt: name, ...options })
        .bindPopup(popup, { closeButton: false })
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

// A view owns the common Leaflet infrastructure; callers own data and overlays.
const createMapView = (container, { minimap = true } = {}) => {
    const map = L.map(container)
    if (map.zoomControl) {
        const zoom = map.zoomControl.getContainer()
        setMapControlIcon(zoom.querySelector(".leaflet-control-zoom-in"), "plus")
        setMapControlIcon(zoom.querySelector(".leaflet-control-zoom-out"), "minus")
    }
    const tileURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const createTiles = () => L.tileLayer(tileURL, {
        maxZoom: 18,
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
    })
    createTiles().addTo(map)
    let home, resetControl, maximize, destroyed = false
    const resetView = (options = {}) => {
        if (home) map.setView(home.center, home.zoom, options)
    }
    const setHomeView = ({ bounds, center, zoom, ...options }) => {
        if (bounds) map.fitBounds(bounds, options)
        else map.setView(center, zoom, options)
        home = { center: map.getCenter(), zoom: map.getZoom() }
        // Controls requiring a center are installed only after the first view is set.
        if (resetControl) map.removeControl(resetControl)
        else L.control.scale({ position: "bottomright", imperial: false }).addTo(map)
        resetControl = L.control.resetView({
            position: "topleft", latlng: home.center, zoom: home.zoom,
        }).addTo(map)
        setMapControlIcon(resetControl.getContainer().querySelector("a"), "arrow-rotate-left")
        if (!maximize) {
            maximize = addMapMaximizeControl(map)
            if (minimap) new L.Control.MiniMap(createTiles(), {
                position: "bottomleft", minimized: false,
            }).addTo(map)
        }
    }
    return {
        map, setHomeView, resetView,
        get maximize() { return maximize },
        destroy() {
            if (destroyed) return
            destroyed = true
            maximize?.restore()
            map.remove()
        },
    }
}
