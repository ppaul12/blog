---
---

// Shared by the page carousel and the large-image viewer.
const photoMetadata = (() => {
    const cache = new Map()
    const collections = new Map()
    // Share in-flight and completed photo lists; failed loads remain retryable.
    const loadPhotos = (url) => {
        const key = new URL(url, window.location.href).href
        if (!collections.has(key)) {
            collections.set(key, asyncLoadJSON(key).catch((error) => {
                collections.delete(key)
                throw error
            }))
        }
        return collections.get(key)
    }
    const resolveURL = (src) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)
        ? src : `{{ site.baseurl }}${src}`
    const text = (value) => value === null || value === undefined || value === "" ? "null" : String(value)
    const heading = (photo) => photo.title || photo.caption || photo.loc || "null"
    const number = (value) => value !== null && value !== undefined && value !== ""
        && Number.isFinite(Number(value)) ? Number(value) : null
    const decimal = (value, digits = 1) => Number(value.toFixed(digits)).toString()
    // Shared field order, labels and formatting for page details and the lightbox.
    const parameters = [
        ["Aperture", "aperture"], ["Shutter", "shutter"], ["ISO", "iso"],
        ["Focal length", "focal"], ["Exp. comp.", "bias", "Exposure compensation"], ["Metering", "metering"],
    ]
    // Each mode owns its label and icon so both views stay consistent.
    const meteringModes = [
        [0, "Unknown", "UNK"],
        [1, "Average", "AVG", "average"],
        [2, "Center-weighted average", "CWA", "center-weighted"],
        [3, "Spot", "SPOT", "spot"],
        [4, "Multi-spot", "MSP", "multi-spot"],
        [5, "Multi-segment", "MULTI", "multi-segment"],
        [6, "Partial", "PART", "partial"],
        [255, "Other", "OTHER"],
    ]
    const formatMetering = (value) => {
        if (value === null || value === undefined || value === "") return null
        const key = String(value).toLowerCase().replace(/[^a-z0-9]/g, "")
        const mode = meteringModes.find(([code, name, short]) =>
            String(code) === key || name.toLowerCase().replace(/[^a-z0-9]/g, "") === key || short.toLowerCase() === key)
            ?? (["pattern", "multisegmentpattern"].includes(key) ? meteringModes[5] : meteringModes[0])
        return { name: mode[1], short: mode[2], icon: mode[3] }
    }
    const formatDate = (value) => {
        if (!value) return "null"
        // A camera-local EXIF timestamp without an offset must not be converted to UTC.
        const match = String(value).match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})/)
        return match ? `${match[1]}.${match[2]}.${match[3]} ${match[4]}:${match[5]}` : text(value)
    }
    const format = (metadata = {}) => {
        metadata ??= {}
        const aperture = number(metadata.fNumber), shutter = number(metadata.exposureTimeSeconds)
        const iso = number(metadata.iso), focal = number(metadata.focalLengthMm), bias = number(metadata.exposureBiasEv)
        const metering = formatMetering(metadata.meteringMode)
        return {
            camera: text(metadata.cameraModel), lens: text(metadata.lensModel),
            aperture: aperture > 0 ? `f/${decimal(aperture)}` : "null",
            shutter: shutter > 0 ? (shutter < 1 ? `1/${Math.round(1 / shutter)}s` : `${decimal(shutter, 3)}s`) : "null",
            iso: iso > 0 ? String(iso) : "null",
            focal: focal > 0 ? `${decimal(focal)}mm` : "null",
            bias: bias !== null ? `${bias > 0 ? "+" : ""}${decimal(bias)}EV` : "null",
            metering: metering?.short ?? "null", meteringName: metering?.name ?? "null", meteringIcon: metering?.icon,
            date: formatDate(metadata.dateTimeOriginal),
        }
    }
    const get = async (photo) => {
        const src = resolveURL(photo.src)
        if (!cache.has(src)) cache.set(src, (async () => {
            if (!window.exifr) return {}
            try {
                // Keep partial range responses separate from full-image requests.
                const url = new URL(src, window.location.href)
                url.searchParams.set("photo-exif", "1")
                const exif = await window.exifr.parse(url.href, {
                    reviveValues: false,
                    translateValues: false,
                    pick: ["Model", "LensModel", "FNumber", "ExposureTime", "ISO", "ISOSpeed",
                        "FocalLength", "ExposureCompensation", "ExposureBiasValue", "MeteringMode", "DateTimeOriginal", "GPSLatitude",
                        "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef"],
                }) ?? {}
                const coordinate = (values, ref) => Array.isArray(values)
                    ? (values[0] + values[1] / 60 + values[2] / 3600) * (["W", "S"].includes(ref) ? -1 : 1) : null
                return {
                    cameraModel: exif.Model, lensModel: exif.LensModel, fNumber: exif.FNumber,
                    exposureTimeSeconds: exif.ExposureTime, iso: exif.ISO ?? exif.ISOSpeed,
                    focalLengthMm: exif.FocalLength, exposureBiasEv: exif.ExposureCompensation ?? exif.ExposureBiasValue,
                    dateTimeOriginal: exif.DateTimeOriginal,
                    meteringMode: exif.MeteringMode,
                    latitude: exif.latitude ?? coordinate(exif.GPSLatitude, exif.GPSLatitudeRef),
                    longitude: exif.longitude ?? coordinate(exif.GPSLongitude, exif.GPSLongitudeRef),
                }
            } catch {
                return {}
            }
        })())
        const extracted = await cache.get(src)
        const supplied = Object.fromEntries(Object.entries(photo.exif ?? {}).filter(([, value]) => value !== null && value !== undefined))
        return { ...extracted, ...supplied }
    }
    const renderMetering = (values) => {
        const icon = values.meteringIcon
        if (!icon) {
            const label = document.createElement("span")
            label.textContent = values.metering
            if (values.metering !== "null") label.title = values.meteringName
            return label
        }
        const namespace = "http://www.w3.org/2000/svg"
        const svg = document.createElementNS(namespace, "svg")
        svg.classList.add("photo-metering-icon")
        svg.setAttribute("viewBox", "0 0 32 24")
        svg.setAttribute("role", "img")
        svg.setAttribute("aria-label", values.meteringName)
        svg.setAttribute("focusable", "false")
        const title = document.createElementNS(namespace, "title")
        title.textContent = values.meteringName
        const use = document.createElementNS(namespace, "use")
        use.setAttribute("href", `${resolveURL("/assets/img/photo/metering.svg")}#${icon}`)
        svg.append(title, use)
        return svg
    }
    const locationURL = (photo, metadata = {}) => {
        metadata ??= {}
        if (photo.link) {
            try {
                const url = new URL(photo.link, window.location.href)
                if (["http:", "https:"].includes(url.protocol)) return url.href
            } catch { /* Invalid links fall back to GPS when available. */ }
        }
        const lat = number(metadata.latitude), lon = number(metadata.longitude)
        return lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
            ? `https://www.google.com/maps?q=${lat},${lon}` : null
    }
    const renderLocation = (photo, metadata, label = photo.loc || "null") => {
        const link = locationURL(photo, metadata)
        const element = document.createElement(link ? "a" : "span")
        element.textContent = label
        if (link) {
            element.href = link
            if (element.origin !== window.location.origin) {
                element.target = "_blank"
                element.rel = "noopener noreferrer"
            }
        }
        return element
    }
    return { loadPhotos, get, format, heading, parameters, resolveURL, renderLocation, renderMetering }
})()
