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
