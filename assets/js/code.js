const setCodeTheme = (theme) => {
    const themeLink = document.getElementById("prism-theme")
    themeLink.href = `${themeLink.dataset.href}prism-one-${theme}.min.css`
}

setCodeTheme(document.documentElement.dataset.theme)
const code_observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
            setCodeTheme(mutation.target.getAttribute(mutation.attributeName))
        }
    })
})
code_observer.observe(document.documentElement, { attributes: true })
