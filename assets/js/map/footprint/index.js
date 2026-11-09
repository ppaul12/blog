// The layout flag comes from the same CSS rule that stacks map and details.
const revealFootprintMapDetail = (view, detail) => {
    view.maximize.close(() => {
        const explorer = detail.closest(".footprint-explorer")
        if (getComputedStyle(explorer).getPropertyValue("--footprint-map-stacked").trim() === "1") {
            detail.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    })
}

const initFootprintMap = async (options) => {
    const dateSelect = document.getElementById("footprint-date")
    const resetButton = document.getElementById("footprint-reset")
    let view, selectedLocation
    try {
        const data = await loadFootprintData(options)
        const { locations } = data
        const filterYears = [...new Set(locations.flatMap(({visitMonths}) => visitMonths.map((month) => month.slice(0, 4))))]
            .sort((a, b) => b.localeCompare(a))
        filterYears.forEach((year) => {
            const group = document.createElement("optgroup")
            group.label = year
            const yearOption = document.createElement("option")
            yearOption.value = year
            yearOption.textContent = `All ${year}`
            group.append(yearOption)
            const months = [...new Set(locations.flatMap(({visitMonths}) => visitMonths))]
                .filter((month) => month.startsWith(`${year}-`))
                .sort((a, b) => b.localeCompare(a))
            months.forEach((month) => {
                const option = document.createElement("option")
                option.value = month
                option.textContent = month.replace("-", "/")
                group.append(option)
            })
            dateSelect.append(group)
        })

        const detail = document.getElementById("footprint-detail")
        const detailEmpty = detail.querySelector(".footprint-detail-empty")
        const detailContent = detail.querySelector(".footprint-detail-content")
        const detailTitle = document.getElementById("footprint-detail-title")
        const detailMeta = document.getElementById("footprint-detail-meta")
        const detailDates = document.getElementById("footprint-detail-dates")
        const relatedJourneys = document.getElementById("footprint-related-journeys")
        const detailRecords = document.getElementById("footprint-detail-records")
        const ticketTemplate = document.getElementById("footprint-ticket-template")
        let detailAnimations = []

        const animateDetail = () => {
            detailAnimations.forEach((animation) => animation.cancel())
            detailAnimations = []

            const elements = detailContent.hidden
                ? [...detailEmpty.children]
                : [detailTitle, detailMeta, detailDates, relatedJourneys.querySelector("h4"), ...detailRecords.children]
            detailAnimations = elements
                .filter((element) => !element.hidden && element.getClientRects().length)
                .map((element, index) => element.animate([
                    { opacity: 0, transform: "translateY(10px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ], {
                    duration: 1000,
                    delay: Math.min(index, 5) * 45,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    fill: "backwards",
                }))
        }

        const createJourneyTicket = (record, index) => {
            const link = document.createElement("a")
            link.className = "footprint-ticket footprint-ticket--compact"
            link.href = record.url
            link.append(ticketTemplate.content.cloneNode(true))

            link.querySelector(".footprint-ticket-title").textContent = record.title || "View journey"
            const subtitle = link.querySelector(".footprint-ticket-subtitle")
            subtitle.textContent = record.subtitle || ""
            subtitle.hidden = !record.subtitle

            const date = link.querySelector(".footprint-ticket-date")
            date.textContent = record.date.replace("/", ".")
            date.dateTime = record.date.replace("/", "-")
            link.querySelector(".footprint-ticket-number").textContent = String(index + 1).padStart(2, "0")
            return link
        }

        const showLocation = (location) => {
            selectedLocation = location
            detailEmpty.hidden = true
            detailContent.hidden = false
            detailTitle.textContent = location.loc
            detailMeta.textContent = location.isResidence
                ? `Former residence · ${location.residencePeriods.map((period) => formatFootprintPeriod(period).label).join(", ")}`
                : location.records.length
                    ? `${location.records.length} ${location.records.length === 1 ? "journey" : "journeys"} · Last visited ${location.records[0].year}`
                    : "Saved place · No linked journeys"
            detailDates.replaceChildren()
            detailDates.hidden = location.isResidence
            relatedJourneys.hidden = !location.records.length
            const visits = location.visits.length ? location.visits : ["No dates recorded"]
            visits.forEach((visit) => {
                const tag = document.createElement("span")
                tag.className = location.visits.length ? "footprint-visit-tag" : "footprint-visit-tag is-empty"
                tag.textContent = visit
                detailDates.append(tag)
            })
            detailRecords.replaceChildren(...location.records.map(createJourneyTicket))
            animateDetail()
        }

        view = createFootprintMapView("footprint-map", {
            onSelectPlace(location) {
                showLocation(location)
                revealFootprintMapDetail(view, detail)
            },
        })
        const clearDetail = (empty = false) => {
            selectedLocation = undefined
            detailEmpty.hidden = false
            detailContent.hidden = true
            detailEmpty.querySelector("h3").textContent = empty ? "No places found" : "Select a place"
            detailEmpty.querySelector("p").textContent = empty
                ? "Try another date or reset the filter."
                : "Select a marker on the map to see its dates and related journeys."
            animateDetail()
        }
        const refreshMarkers = () => {
            const selectedDate = dateSelect.value
            const filtered = filterFootprintData(data, selectedDate)
            view.setLocations(filtered.locations)
            document.getElementById("footprint-place-count").textContent = selectedDate
                ? `${filtered.locations.length} / ${locations.length}`
                : filtered.locations.length
            document.getElementById("footprint-trip-count").textContent = filtered.journeyCount
            if (!filtered.locations.length) clearDetail(true)
            else if (!selectedLocation || !filtered.locations.includes(selectedLocation)) clearDetail()
        }
        const reset = () => {
            dateSelect.value = ""
            selectedLocation = undefined
            refreshMarkers()
            view.resetView({ animate: true })
        }
        dateSelect.addEventListener("change", refreshMarkers)
        resetButton.addEventListener("click", reset)
        refreshMarkers()
        return {
            ...view,
            destroy() {
                dateSelect.removeEventListener("change", refreshMarkers)
                resetButton.removeEventListener("click", reset)
                detailAnimations.forEach((animation) => animation.cancel())
                view.destroy()
            },
        }
    } catch (error) {
        view?.destroy()
        console.error("Failed to load footprint data:", error)
        document.getElementById("footprint-place-count").textContent = "—"
    }
}
