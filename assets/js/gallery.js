// init gallery modal
function initGalleryModal() {
    window.addEventListener("load", () => {
        document.querySelectorAll(".gallery img").forEach((img, idx) => {
            // create modal dialog
            let button = document.createElement("div")
            button.className = "close-btn"
            button.setAttribute("data-target", `pic${idx + 1}`)
            button.onclick = toggleModal
            let header = document.createElement("header")
            header.appendChild(button)
            header.appendChild(img.nextElementSibling.cloneNode(true))
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
