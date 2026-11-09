const mapTrackColor = (type) => {
    // Stable type assignments survive reordering, filtering, and page changes.
    const knownTypes = ["🚴", "🚶", "🚗", "🚃"]
    let index = knownTypes.indexOf(type)
    if (index < 0) {
        index = Array.from(type).reduce((hash, character) => (hash * 31 + character.codePointAt(0)) >>> 0, 0) % 4
    }
    return getComputedStyle(document.documentElement)
        .getPropertyValue(`--site-map-track-${index + 1}`).trim()
}

const loadMapTracks = async (trackURLs = [], baseURL = "", color = mapTrackColor("🚴")) => {
    const haloColor = getComputedStyle(document.documentElement).getPropertyValue("--site-map-halo").trim()
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
                const halo = L.polyline(points, {
                    color: haloColor,
                    weight: 7, opacity: 0.9, interactive: false,
                })
                const line = L.polyline(points, {
                    color, weight: 4, opacity: 1,
                    interactive: false,
                })
                return L.featureGroup([halo, line])
            }).filter(Boolean)
            return L.featureGroup(lines)
        } catch (error) {
            console.warn(`Unable to load track: ${url}`, error)
            return null
        }
    }))
    return L.featureGroup(trackLayers.filter(Boolean))
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

