// my scripts

// init insite search
function initSearch() {
    window.addEventListener("load", () => {
        let button = document.createElement("button")
        button.className = "contrast faa-parent animated-hover"
        button.setAttribute("data-target", "search-box")
        button.onclick = toggleModal
        button.style.order = -1
        button.innerHTML = `<i class="fa-solid fa-magnifying-glass faa-wrench faa-slow"></i>`
        document.querySelector(".button-box").appendChild(button)
        const sjs = SimpleJekyllSearch({
            json: "/assets/json/search.json",
            searchInput: document.getElementById("search-input"),
            resultsContainer: document.getElementById("search-results"),
            searchResultTemplate: `
                <article onclick="location.href='{url}'"><hgroup>
                    <h3>{icon} {title}</h3>
                    <h4><em>{info}</em></h4>
                </hgroup></article>
            `,
            noResultsText: "<article>No results found</article>",
            limit: 10
        })
    })
    document.addEventListener("keyup", e => {
        if (e.key == "/") {
            document.getElementById("search-input").focus()
        }
    })
}

// init theme switcher
function initThemeSwitcher() {
    window.addEventListener("load", () => {
        let button = document.createElement("button")
        button.className = "theme-switcher contrast faa-parent animated-hover"
        button.style.order = -2
        document.querySelector(".button-box").appendChild(button)
        themeSwitcher.init()
    })
}

// init scrollable table
function initTableScroll() {
    window.addEventListener("load", () => {
        document.querySelectorAll("table").forEach(tbl => {
            tbl.outerHTML = `<figure>${tbl.outerHTML}</figure>`
        })
    })
}

// init gallery modal
function initGalleryModal() {
    window.addEventListener("load", () => {
        document.querySelectorAll(".gallery img").forEach((img, idx) => {
            // create modal dialog
            let header = document.createElement("header")
            header.innerHTML = `<div class="close-btn" data-target="pic${idx + 1}" onclick="toggleModal(event)"></div>`
            let article = document.createElement("article")
            article.appendChild(header)
            article.appendChild(img.cloneNode())
            let modal = document.createElement("dialog")
            modal.id = `pic${idx + 1}`
            modal.appendChild(article)
            // find gallery
            document.querySelector(".gallery").appendChild(modal)
            // set target info
            img.setAttribute("data-target", `pic${idx + 1}`)
            img.onclick = toggleModal
        })
    })
}

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

// init responding details
function initRespondingDetails() {
    window.addEventListener("load", () => {
        const tag = decodeURI(location.hash).substring(1)
        if (tag.length > 0) {
            document.getElementById(tag).open = true
        }
    })
    window.addEventListener("hashchange", () => {
        const tag = decodeURI(location.hash).substring(1)
        document.querySelectorAll("details").forEach(details => {
            details.open = details.id == tag
        })
    })
}

// init toc
function initToc(object, target) {
    window.addEventListener("load", () => {
        // generate toc
        let prevTag = "", currTag = "", tagStack = new Array()
        const text = Array.from(object.querySelectorAll(target)).reduce((toc, header) => {
            currTag = header.tagName
            if (currTag > prevTag) { // h1 -> h2, h2 -> h3
                toc += `<ul><li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</ul>")
                tagStack.push("</li>")
            } else if (currTag == prevTag) { // h1 -> h1, h2 -> h2, h3 -> h3
                toc += tagStack.pop() // </li>
                toc += `<li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</li>")
            } else { // h3 -> h2, h3 -> h1, h2 -> h1
                toc += tagStack.pop() // </li>
                for (let i = 0; i < (prevTag[1] - currTag[1]); i++) {
                    toc += tagStack.pop() // </ul>
                    toc += tagStack.pop() // </li>
                }
                toc += `<li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</li>")
            }
            prevTag = currTag
            return toc
        }, "") + tagStack.reduce((a, b) => a + b, "")
        // append text to dialog
        if (text.length > 0) {
            let toc = document.createElement("div")
            toc.className = "tree-list"
            toc.innerHTML = "TOC" + text
            document.querySelector("#toc-box > article").appendChild(toc)
            // add a sidebar button
            let button = document.createElement("button")
            button.className = "contrast faa-parent animated-hover"
            button.setAttribute("data-target", "toc-box")
            button.onclick = toggleModal
            button.innerHTML = `<i class="fa-solid fa-bars-staggered faa-shake faa-slow"></i>`
            document.querySelector(".button-box").appendChild(button)
        }
    })
}
