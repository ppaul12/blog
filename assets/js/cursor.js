// Cursor appearance only. Components retain their own native hover/click behavior.
(() => {
    const capability = matchMedia("(hover: hover) and (pointer: fine)")
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
    const forcedColors = matchMedia("(forced-colors: active)")
    const root = document.documentElement
    const cursor = document.createElement("div")
    cursor.className = "site-cursor"
    cursor.setAttribute("aria-hidden", "true")
    document.body.append(cursor)

    // Only navigation/controller controls hide the dot. Other hover targets dim it.
    // Explicit targets avoid inspecting stylesheets or measuring UI geometry.
    const actionSelector = 'a[href], button, summary, [role="button"]'
    const hideScope = '.site-navigation, .controller'
    const hoverSelector = [
        actionSelector, '[data-tooltip]', '.card-hover', '.post-card',
        '.travel-info-card', '[data-cursor="hover"]',
    ].join(", ")
    const nativeRegion = [
        'dialog[open]:not(.site-modal)', '.leaflet-container', '.lg-container', '.album-card',
        '.map-maximized-overlay', '.gallery-maximized-overlay',
        'iframe', 'video', 'audio', 'canvas', 'input', 'textarea', 'select',
        '[contenteditable]:not([contenteditable="false"])', '[draggable="true"]',
        '[data-cursor="native"]', '[role="slider"]', '[role="textbox"]',
        'pre', 'code', '[disabled]', '[aria-disabled="true"]', '[inert]',
    ].join(", ")
    const overlaySelector = [
        'dialog[open]:not(.site-modal)', ':fullscreen',
        '.lg-container.lg-show:not(.lg-inline)',
        '.gallery-maximized-overlay', '.map-maximized-overlay',
    ].join(", ")
    let position = null
    let hit = null
    let blocked = false
    let layoutDirty = true
    let pointerDirty = true
    let frame = 0
    let pressed = false
    let nativeDrag = false
    let visual = null
    let lastTime = null
    // Critically damped motion: a short acceleration with no spring oscillation.
    const response = 48

    const enabled = () => capability.matches && !reducedMotion.matches && !forcedColors.matches
    const hide = () => {
        cancelAnimationFrame(frame)
        frame = 0
        position = hit = null
        visual = lastTime = null
        layoutDirty = true
        pointerDirty = true
        cursor.removeAttribute("data-pressed")
        root.removeAttribute("data-site-cursor")
    }

    // Reclassify only on input/layout changes, using the real mouse position.
    const updateInteraction = () => {
        if (!layoutDirty && !pointerDirty) return true
        const { x, y } = position
        if (layoutDirty) {
            hit = document.elementFromPoint(x, y)
            blocked = Boolean(document.querySelector(overlaySelector))
        }
        if (!hit?.closest || blocked || x >= root.clientWidth || y >= root.clientHeight ||
            hit.closest(nativeRegion)) return false

        // A body-level cursor cannot paint above a modal's browser top layer.
        const layer = hit.closest('dialog.site-modal[open]') || document.body
        if (cursor.parentElement !== layer) layer.append(cursor)

        const action = hit.closest(actionSelector)
        let mode = "dot"
        if (action?.closest(hideScope)) mode = "control"
        else if (hit.closest(hoverSelector)) mode = "hover"
        if (cursor.dataset.mode !== mode) cursor.dataset.mode = mode
        layoutDirty = pointerDirty = false
        return true
    }

    // Inertia frames only update the visual position; they never measure UI geometry.
    const updateMotion = (time) => {
        const { x, y } = position
        if (!visual || cursor.dataset.mode === "control") {
            visual = { x, y, vx: 0, vy: 0 }
        } else {
            const dt = lastTime === null ? 1 / 60 : Math.min((time - lastTime) / 1000, 0.05)
            const decay = Math.exp(-response * dt)
            const dx = visual.x - x
            const dy = visual.y - y
            const stepX = (visual.vx + response * dx) * dt
            const stepY = (visual.vy + response * dy) * dt
            visual.x = x + (dx + stepX) * decay
            visual.y = y + (dy + stepY) * decay
            visual.vx = (visual.vx - response * stepX) * decay
            visual.vy = (visual.vy - response * stepY) * decay
        }
        const moving = Math.hypot(visual.x - x, visual.y - y) > 0.15 ||
            Math.hypot(visual.vx, visual.vy) > 8
        if (!moving) visual = { x, y, vx: 0, vy: 0 }
        cursor.style.transform = `translate3d(${visual.x}px, ${visual.y}px, 0)`
        lastTime = moving ? time : null
        return moving
    }

    const render = (time) => {
        frame = 0
        if (!position || !enabled() || nativeDrag || !updateInteraction()) return hide()
        const moving = updateMotion(time)
        if (!root.hasAttribute("data-site-cursor")) root.setAttribute("data-site-cursor", "")
        // Stop as soon as settled/hidden; never run a permanent animation loop.
        if (moving) frame = requestAnimationFrame(render)
    }
    const schedule = () => {
        if (position && !frame) frame = requestAnimationFrame(render)
    }
    const refresh = () => {
        layoutDirty = true
        schedule()
    }
    const move = (event) => {
        position = { x: event.clientX, y: event.clientY }
        hit = event.target
        pointerDirty = true
        schedule()
    }

    const hasSelection = () => Boolean(window.getSelection()?.toString())
    const resetInput = () => {
        pressed = nativeDrag = false
        hide()
    }
    const startNativeDrag = () => {
        nativeDrag = true
        hide()
    }

    document.addEventListener("pointermove", (event) => {
        // Recover even when the mouse was released outside the document/iframe.
        pressed = Boolean(event.buttons & 1)
        if (!pressed) nativeDrag = false
        if (event.pointerType !== "mouse" || (event.buttons & ~1) || nativeDrag || !enabled()) return hide()
        cursor.toggleAttribute("data-pressed", pressed)
        move(event)
    }, { passive: true })
    document.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || !enabled()) return hide()
        pressed = true
        nativeDrag = false
        cursor.setAttribute("data-pressed", "")
        move(event)
    }, { passive: true })
    window.addEventListener("pointerup", (event) => {
        pressed = false
        nativeDrag = false
        cursor.removeAttribute("data-pressed")
        if (event.pointerType === "mouse" && event.button === 0 && enabled() && !hasSelection()) move(event)
        else hide()
    }, { passive: true })
    window.addEventListener("pointercancel", resetInput, { passive: true })
    root.addEventListener("pointerleave", hide)
    document.addEventListener("pointerout", (event) => {
        if (!event.relatedTarget) hide()
    }, { passive: true })
    window.addEventListener("blur", resetInput)
    window.addEventListener("pagehide", hide)
    document.addEventListener("visibilitychange", hide)
    document.addEventListener("keydown", hide)
    document.addEventListener("selectionchange", () => {
        if (pressed && hasSelection()) startNativeDrag()
    })
    document.addEventListener("dragstart", startNativeDrag)
    document.addEventListener("contextmenu", hide)
    document.addEventListener("scroll", refresh, { capture: true, passive: true })
    window.addEventListener("resize", refresh, { passive: true })
    document.addEventListener("fullscreenchange", refresh)
    for (const media of [capability, reducedMotion, forcedColors]) media.addEventListener("change", hide)

    // Re-evaluate stationary pointers after a modal or dynamic component changes.
    new MutationObserver(refresh).observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["open", "hidden", "disabled", "inert", "aria-disabled", "class", "data-cursor"],
    })
})()
