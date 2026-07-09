const books_observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            books_observer.unobserve(img)
        }
    }
}, {
    root: null,
    threshold: 0,
})

document.querySelectorAll(".book-img .cover").forEach((img) => {
    books_observer.observe(img)
})

const toggleShelf = (event) => {
    document.querySelectorAll(".book-shelf").forEach((shelf) => {
        if (shelf.contains(event.target)) {
            shelf.toggleAttribute("active")
            shelf.scrollIntoView()
        }
    })
    AOS.refresh()
}
