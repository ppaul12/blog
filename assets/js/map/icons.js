// Map action controls use Font Awesome; markers and legends retain their original appearance.
const createMapIcon = (name) => {
    const icon = document.createElement("i")
    icon.className = `fa-solid fa-${name}`
    icon.setAttribute("aria-hidden", "true")
    return icon
}

// Keep plugin click behavior and accessible names while replacing its glyph.
const setMapControlIcon = (element, icon) => {
    if (element) {
        element.classList.add("map-icon-control")
        element.replaceChildren(createMapIcon(icon))
    }
}
