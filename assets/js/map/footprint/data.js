const formatFootprintPeriod = (value) => {
    const matches = [...String(value).matchAll(/(\d{4})\/(\d{2})/g)]
    if (!matches.length) return {label: String(value), months: []}

    const toParts = ([, year, month]) => [Number(year), Number(month)]
    const [startYear, startMonth] = toParts(matches[0])
    const [endYear, endMonth] = matches[1]
        ? toParts(matches[1])
        : String(value).includes("~")
            ? [new Date().getFullYear(), new Date().getMonth() + 1]
            : [startYear, startMonth]
    const months = []
    const cursor = new Date(startYear, startMonth - 1, 1)
    const end = new Date(endYear, endMonth - 1, 1)
    while (cursor <= end) {
        months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)
        cursor.setMonth(cursor.getMonth() + 1)
    }
    const start = `${startYear}/${String(startMonth).padStart(2, "0")}`
    const finish = `${endYear}/${String(endMonth).padStart(2, "0")}`
    const label = matches[1]
        ? `${start}–${finish}`
        : String(value).includes("~") ? `${start}–present` : start
    return {label, months}
}

const loadFootprintData = async ({ mapsURL, spotsURL }) => {
    const [locSets, spots] = await Promise.all([
        asyncLoadJSON(mapsURL), asyncLoadJSON(spotsURL),
    ])
    const tripLocations = (await Promise.all(locSets.map(async (locSet) => {
        const data = await asyncLoadJSON(locSet.json)
        const spot = data.album ?? data.spot
        return Object.entries(spot).map(([loc, pos]) => ({
            loc,
            pos,
            records: [{
                date: locSet.date,
                year: locSet.date.slice(0, 4),
                title: locSet.title,
                subtitle: locSet.subtitle,
                url: locSet.link,
            }],
            notes: [],
        }))
    }))).flat()

    const locations = Object.entries(Object.groupBy(
        tripLocations.concat(spots.map((spot) => ({...spot, records: [], notes: spot.info ?? []}))),
        ({loc}) => loc,
    )).map(([loc, entries]) => {
        const records = entries.flatMap(({records}) => records).sort((a, b) => b.date.localeCompare(a.date))
        const notes = [...new Set(entries.flatMap(({notes}) => notes))]
        const residencePeriods = notes.filter((note) => note.includes("~"))
        const isResidence = residencePeriods.length > 0
        const periods = (isResidence
            ? residencePeriods
            : [...notes, ...records.map(({date}) => date)]).map(formatFootprintPeriod)
        return {
            loc,
            pos: entries[0].pos,
            records: isResidence ? [] : records,
            isResidence,
            residencePeriods,
            visits: [...new Set(periods.map(({label}) => label))].sort((a, b) => b.localeCompare(a)),
            visitMonths: [...new Set(periods.flatMap(({months}) => months))],
        }
    })
    return { journeys: locSets, locations }
}

const matchesFootprintDate = (months, selectedDate) => {
    if (!selectedDate) return true
    return selectedDate.length === 4
        ? months.some((month) => month.startsWith(`${selectedDate}-`))
        : months.includes(selectedDate)
}

const filterFootprintData = ({ locations, journeys }, selectedDate) => ({
    locations: locations.filter(({ visitMonths }) => matchesFootprintDate(visitMonths, selectedDate)),
    journeyCount: journeys.filter(({ date }) => matchesFootprintDate(formatFootprintPeriod(date).months, selectedDate)).length,
})
