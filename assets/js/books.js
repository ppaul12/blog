const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            observer.unobserve(img)
        }
    }
}, {
    root: null,
    threshold: 0,
})

document.querySelectorAll(".book-img .cover").forEach((img) => {
    observer.observe(img)
})
