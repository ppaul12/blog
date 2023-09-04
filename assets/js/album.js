// init album
function initAlbum() {
    const shuffled = (array) => {
        let currentIdx = array.length
        while (currentIdx > 0) {
            const targetIdx = Math.floor(Math.random() * currentIdx)
            currentIdx--
            [array[currentIdx], array[targetIdx]] = [array[targetIdx], array[currentIdx]]
        }
        return array
    }
    const next = (pics, idx = 0) => {
        const album = document.getElementById("album")
        album.scrollIntoView({ behavior: "smooth" })
        if (document.getElementById("album-button").hasAttribute("state-pause")) {
            window.setTimeout(next, 1000, pics, idx)
        } else {
            // move out the existing elements
            album.childNodes.forEach(elem => {
                elem.className = "move-out"
            })
            // move in new elements
            window.setTimeout(() => {
                album.innerHTML = ""
                const pic = pics[idx]
                const img = document.createElement("img")
                img.src = pic.path
                img.onclick = () => { location.href = pic.path }
                album.appendChild(img)
                const info = document.createElement("p")
                info.innerHTML = pic.info
                info.onclick = () => { location.href = pic.url }
                album.appendChild(info)
                album.childNodes.forEach(elem => {
                    elem.className = "move-in"
                })
            }, 1000)
            // change elements automatically
            window.setTimeout(next, 5000, pics, (idx + 1) % pics.length)
        }
    }
    const pause = (event = null) => {
        const button = document.getElementById("album-button")
        button.setAttribute("state-pause", '')
        button.innerHTML = `<i class="fa-solid fa-play faa-shake faa-slow"></i>`
        button.onclick = resume
    }
    const resume = (event = null) => {
        const button = document.getElementById("album-button")
        button.removeAttribute("state-pause")
        button.innerHTML = `<i class="fa-solid fa-pause faa-shake faa-slow"></i>`
        button.onclick = pause
    }
    window.addEventListener("load", () => {
        // prepare random photos
        fetch("/assets/json/album.json").then(response => response.json()).then(data => {
            // add album button
            let button = document.createElement("button")
            button.id = "album-button"
            button.className = "contrast faa-parent animated-hover"
            document.querySelector(".button-box").appendChild(button)
            // start slide show
            resume(next(shuffled(data)))
        })
    })
}
