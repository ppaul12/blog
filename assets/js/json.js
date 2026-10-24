// Read JSON and report failures with their source URL; callers decide how to recover.
async function asyncLoadJSON(url) {
    let response
    try {
        response = await fetch(url)
    } catch (error) {
        throw new Error(`Unable to fetch JSON: ${url}`, { cause: error })
    }
    if (!response.ok) {
        throw new Error(`Unable to load JSON (HTTP ${response.status}): ${url}`)
    }
    try {
        return await response.json()
    } catch (error) {
        throw new Error(`Invalid JSON: ${url}`, { cause: error })
    }
}

// Read independent JSON files concurrently and concatenate in the supplied order.
async function asyncLoadJSONs(urls) {
    return (await Promise.all(urls.map((url) => asyncLoadJSON(url)))).flat()
}
