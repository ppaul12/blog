const getTheme = () => window.sessionStorage.getItem("data-theme") // get the stored theme
    ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") // get the preferred theme

const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme
    window.sessionStorage.setItem("data-theme", theme)
}

const toggleTheme = () => {
    setTheme({
        "light": "dark",
        "dark": "light",
    }[getTheme()])
}

setTheme(getTheme())
