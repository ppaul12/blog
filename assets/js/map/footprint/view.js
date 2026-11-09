const createFootprintMapView = (container, { onSelectPlace } = {}) => {
    const view = createMapView(container)
    const { map } = view
    view.setHomeView({ center: [39.92503939668526, 116.43328011233142], zoom: 4 })
    const icon = L.icon({
        iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@latest/dist/images/marker-icon.png",
        iconSize: [12, 20],
        iconAnchor: [6, 20],
        popupAnchor: [0, -10],
        shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@latest/dist/images/marker-shadow.png",
        shadowSize: [20, 20],
    })
    const residenceIcon = L.divIcon({
        className: "footprint-residence-marker",
        html: `<span class="footprint-residence-marker__body">${createMapIcon("house").outerHTML}</span>`,
        iconSize: [30, 38],
        iconAnchor: [15, 36],
    })
    const markers = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        showCoverageOnHover: false,
    })
    markers.addTo(map)

    const markerFor = (location) => L.marker(location.pos, {
        icon: location.isResidence ? residenceIcon : icon,
        title: location.loc, alt: location.loc,
    }).on("click", () => onSelectPlace?.(location))
    return {
        ...view,
        setLocations(locations) {
            markers.clearLayers()
            markers.addLayers(locations.map(markerFor))
        },
    }
}
