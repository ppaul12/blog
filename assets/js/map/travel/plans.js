const addMapSegmentSelector = (map, layersControl, { locations, segments, markers, bounds, overviewOptions }) => {
    if (segments.length === 0) return
    const mapId = map.getContainer().id
    const selector = createMapControlGroup(layersControl, "Plans")
    const selectSegment = (selected) => {
        map.closePopup()
        markers.clearLayers()
        if (selected === -1) {
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
        const selectedBounds = L.latLngBounds(segments[selected].map((name) => locations[name]))
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

