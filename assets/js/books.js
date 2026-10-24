(() => {
    const page = document.querySelector(".books-page")
    if (!page) return

    const shelves = [...page.querySelectorAll(".book-shelf")]
    const picker = page.querySelector("#books-year")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let ready = false
    let scrollTimer

    // Keep each history entry independent, including visits to different years.
    const saveState = () => {
        if (!ready) return
        try {
            window.history.replaceState({
                ...window.history.state,
                bookshelf: {
                    open: shelves.filter(shelf => shelf.open).map(shelf => shelf.id),
                    scrollY: window.scrollY,
                },
            }, "")
        } catch {
            // Browsing still works when history state is unavailable.
        }
    }

    const currentShelf = () => {
        const id = window.location.hash.slice(1)
        return [...page.querySelectorAll(".book-shelf, .book-current")].find(shelf => shelf.id === id)
    }

    const revealShelf = (shelf, smooth = false) => {
        if (!shelf) return
        if (shelf.matches("details")) shelf.open = true
        picker.value = shelf.id
        shelf.querySelector("summary")?.focus({ preventScroll: true })
        shelf.scrollIntoView({
            block: "start",
            behavior: smooth && !reducedMotion.matches ? "smooth" : "instant",
        })
    }

    const restoreEntry = () => {
        const state = window.history.state?.bookshelf
        if (Array.isArray(state?.open) && Number.isFinite(state.scrollY)) {
            shelves.forEach(shelf => { shelf.open = state.open.includes(shelf.id) })
            picker.value = currentShelf()?.id || ""
            window.scrollTo({ top: state.scrollY, behavior: "instant" })
        } else {
            revealShelf(currentShelf())
        }
    }

    // Restore expanded content before the browser restores its scroll position.
    const initialState = window.history.state?.bookshelf
    if (Array.isArray(initialState?.open)) {
        shelves.forEach(shelf => { shelf.open = initialState.open.includes(shelf.id) })
    } else {
        const target = currentShelf()
        if (target?.matches("details")) target.open = true
    }

    picker.addEventListener("change", () => {
        const shelf = document.getElementById(picker.value)
        if (!shelf || !page.contains(shelf)) return
        saveState()
        if (window.location.hash !== `#${shelf.id}`) {
            window.history.pushState(null, "", `#${shelf.id}`)
        }
        revealShelf(shelf, true)
        saveState()
    })

    shelves.forEach(shelf => {
        shelf.addEventListener("toggle", () => {
            if (!ready) return
            // Only correct position when a collapsed heading has left the viewport.
            if (!shelf.open && shelf.getBoundingClientRect().top < 0) {
                shelf.scrollIntoView({ block: "start", behavior: "instant" })
            }
            saveState()
        })
    })

    window.addEventListener("scroll", () => {
        window.clearTimeout(scrollTimer)
        scrollTimer = window.setTimeout(saveState, 150)
    }, { passive: true })
    window.addEventListener("pagehide", saveState)
    window.addEventListener("hashchange", () => {
        restoreEntry()
        saveState()
    })
    const initialize = () => {
        restoreEntry()
        ready = true
        saveState()
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true })
    } else {
        initialize()
    }

    // A back/forward-cache visit retains the live DOM and scroll position.
    window.addEventListener("pageshow", event => {
        if (event.persisted) saveState()
    })

    page.querySelector(".books-navigation").hidden = false
})()
