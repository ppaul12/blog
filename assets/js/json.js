// load a JSON file
async function asyncLoadJSON(file) {
    const request = new Request(file)
    const response = await fetch(request)
    return await response.json()
}

// load JSON files and concat
function asyncLoadJSONs(files) {
    return files.reduce(async (output, file) => {
        return (await output).concat(await asyncLoadJSON(file))
    }, Promise.resolve([]))
}
