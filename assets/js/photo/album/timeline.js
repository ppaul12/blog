// Timeline album: date filtering, monthly groups and photo counts.
const parseDailyPhotoFilename = (src) => {
    const match = src.split("/").pop().match(/^(\d{4})(\d{2})(\d{2})-([1-9]\d*)\.[^.]+$/)
    if (!match) throw new Error(`Invalid daily photo filename: ${src}`)
    const [, year, month, day, number] = match
    const sequence = Number(number)
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month)
        || date.getUTCDate() !== Number(day) || !Number.isSafeInteger(sequence)) {
        throw new Error(`Invalid daily photo date or sequence: ${src}`)
    }
    return { date: `${year}-${month}-${day}`, sequence }
}

const collectTimelinePhotos = (sources, start, end) => {
    const photos = sources.flatMap((source, sourceIndex) => source.items.map((item, photoIndex) => {
        const { date, sequence } = source.link
            ? { date: source.date, sequence: photoIndex }
            : parseDailyPhotoFilename(item.src)
        const month = date.slice(0, 7)
        const journey = source.link ? source : null
        return {
            ...item,
            month,
            caption: item.loc || journey?.title || month.replace("-", "."),
            orderDate: `${date}T00:00:00`,
            sourceIndex,
            photoSequence: sequence,
            journey,
        }
    })).filter((item) => start <= item.month && item.month <= end)
    photos.sort((a, b) => a.orderDate.localeCompare(b.orderDate)
        || a.sourceIndex - b.sourceIndex || a.photoSequence - b.photoSequence)

    const seen = new Set()
    return photos.filter(({ src }) => {
        if (seen.has(src)) return false
        seen.add(src)
        return true
    })
}

const initTimelineAlbum = async (id, { sources, start, end }, baseURL = "") => {
    const element = document.getElementById(id)
    const status = element.querySelector("[role=status]")
    try {
        const results = await Promise.allSettled(sources.map(async (source) => ({
            ...source,
            items: await asyncLoadJSON(source.json),
        })))
        const loaded = results.filter((result) => result.status === "fulfilled").map((result) => result.value)
        const failed = results.filter((result) => result.status === "rejected")
        failed.forEach((result) => console.warn("Unable to load timeline album photos", result.reason))
        if (loaded.length === 0) throw new Error("No photo collections could be loaded.")

        const photos = collectTimelinePhotos(loaded, start, end)
        status.textContent = failed.length ? "Some photo collections could not be loaded." : ""
        status.hidden = failed.length === 0

        const counts = new Map()
        photos.forEach(({ month, journey }) => {
            if (!counts.has(month)) counts.set(month, { daily: 0, travel: 0 })
            counts.get(month)[journey ? "travel" : "daily"]++
        })
        const legend = document.createElement("p")
        legend.className = "timeline-album-chart-legend"
        legend.dataset.aos = "fade-up"
        for (const [type, label] of [["daily", "Daily"], ["travel", "Travel"]]) {
            const key = document.createElement("span")
            key.className = `timeline-album-chart-key is-${type}`
            key.textContent = label
            legend.append(key)
        }
        const totalCount = document.createElement("span")
        totalCount.className = "timeline-album-chart-total"
        totalCount.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"} in total`
        legend.append(totalCount)
        const chart = document.createElement("nav")
        chart.className = "timeline-album-chart"
        chart.dataset.aos = "fade-up"
        chart.setAttribute("aria-label", `Monthly photo counts: ${photos.length} photos in total`)
        const maximum = Math.max(1, ...Array.from(counts.values(), ({ daily, travel }) => daily + travel))
        let [year, monthNumber] = start.split("-").map(Number)
        for (let month = start; month <= end;) {
            const { daily = 0, travel = 0 } = counts.get(month) || {}
            const count = daily + travel
            const item = document.createElement(count ? "a" : "span")
            item.className = "timeline-album-chart-item"
            item.style.setProperty("--timeline-album-month-height", `${count / maximum * 100}%`)
            const label = `${month.replace("-", ".")}: ${count} ${count === 1 ? "photo" : "photos"} (${daily} daily, ${travel} travel)`
            item.setAttribute("aria-label", label)
            item.title = label
            if (count) item.href = `#${id}-${month}`
            else item.classList.add("is-empty")

            const total = document.createElement("span")
            total.className = "timeline-album-chart-count"
            total.textContent = count
            const column = document.createElement("span")
            column.className = "timeline-album-chart-column"
            const bar = document.createElement("span")
            bar.className = "timeline-album-chart-bar"
            bar.setAttribute("aria-hidden", "true")
            for (const [type, amount] of [["daily", daily], ["travel", travel]]) {
                const segment = document.createElement("span")
                segment.className = `timeline-album-chart-segment is-${type}`
                segment.style.height = `${count ? amount / count * 100 : 0}%`
                bar.append(segment)
            }
            column.append(bar)
            const monthLabel = document.createElement("span")
            monthLabel.className = "timeline-album-chart-month"
            monthLabel.textContent = String(monthNumber).padStart(2, "0")
            const yearLabel = document.createElement("span")
            yearLabel.className = "timeline-album-chart-year"
            yearLabel.textContent = month === start || monthNumber === 1 ? year : ""
            item.append(total, column, monthLabel, yearLabel)
            chart.append(item)

            if (++monthNumber > 12) { year++; monthNumber = 1 }
            month = `${year}-${String(monthNumber).padStart(2, "0")}`
        }
        element.append(legend, chart)
        if (photos.length === 0) return

        // The entire year shares a single lightbox, including across month boundaries.
        const album = initAlbum(id, photos, baseURL)
        const fragment = document.createDocumentFragment()
        let month, grid
        photos.forEach((item, index) => {
            if (item.month !== month) {
                month = item.month
                const section = document.createElement("section")
                section.className = "timeline-album-month"
                const heading = document.createElement("h4")
                heading.dataset.aos = "fade-up"
                heading.id = `${id}-${month}`
                heading.tabIndex = -1
                const time = document.createElement("time")
                time.dateTime = month
                time.textContent = month.replace("-", ".")
                heading.append(time)
                section.setAttribute("aria-labelledby", heading.id)
                section.append(heading)
                grid = document.createElement("div")
                grid.className = "album-grid"
                section.append(grid)
                fragment.append(section)
            }

            const card = album.createCard(index, {
                label: `Open photo ${index + 1} of ${photos.length}: ${item.caption}`,
                className: `is-${item.journey ? "travel" : "daily"}`,
            })
            grid.append(card)
        })
        element.append(fragment)
        // Adding the grids moves the article lists below them.
        album.refreshAOS()
    } catch (error) {
        console.warn("Unable to initialize timeline album", error)
        status.textContent = "Unable to load photos. Please reload to try again."
    } finally {
        element.setAttribute("aria-busy", "false")
        if (typeof AOS !== "undefined") AOS.refreshHard()
    }
}

