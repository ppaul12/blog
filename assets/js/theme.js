const getTheme = () => window.localStorage.getItem("data-theme") // get the stored theme
    ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") // get the preferred theme

const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme)
    window.localStorage.setItem("data-theme", theme)
}

const toggleTheme = () => {
    setTheme({
        "light": "dark",
        "dark": "light",
    }[getTheme()])
}

setTheme(getTheme())
