// init album
function initAlbum() {
    // choose photos randomly
    const sample = (array, size=1) => {
        size = Math.max(0, Math.min(size, array.length))
        if (size == 0) return []
        const idx = Math.floor(Math.random() * array.length)
        const rest = [].concat(array.slice(0, idx), array.slice(idx + 1, array.length))
        return [array[idx]].concat(sample(rest, size - 1))
    }
    const shufflePics = (pics) => {
        const album = document.getElementById("album")
        album.innerHTML = ""
        sample(pics, 4).forEach(pic => {
            const item = document.createElement("div")
            item.className = "item"
            item.onclick = event => { location.href = pic.url }
            item.innerHTML = `<img src="${pic.path}"><p>${pic.info}</p>`
            album.appendChild(item)
        })
    }
    window.addEventListener("load", () => {
        // prepare random photos
        fetch("/assets/json/album.json").then(response => response.json()).then(data => {
            shufflePics(data)
            // add shuffle button
            let button = document.createElement("button")
            button.className = "contrast faa-parent animated-hover"
            button.onclick = (event) => { shufflePics(data) }
            button.innerHTML = `<i class="fa-solid fa-shuffle faa-shake faa-slow"></i>`
            document.querySelector(".button-box").appendChild(button)
        })
    })
}
