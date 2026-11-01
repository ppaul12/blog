const themePreference = window.matchMedia("(prefers-color-scheme: dark)")
const isTheme = (theme) => theme === "light" || theme === "dark"

const readStoredTheme = () => {
    try {
        const stored = window.sessionStorage.getItem("data-theme")
        return isTheme(stored) ? stored : null
    } catch {
        return null
    }
}
let manualTheme = readStoredTheme()

const getTheme = () => {
    const configured = document.documentElement.dataset.mode
    return manualTheme
        ?? (isTheme(configured) ? configured : null)
        ?? (themePreference.matches ? "dark" : "light")
}

const setTheme = (theme) => {
    if (!isTheme(theme)) return
    manualTheme = theme
    document.documentElement.dataset.theme = theme
    try {
        window.sessionStorage.setItem("data-theme", theme)
    } catch {
        // Switching still works when storage is unavailable.
    }
}

const toggleTheme = () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")
}

// Automatic resolution must not become a saved manual preference.
document.documentElement.dataset.theme = getTheme()
themePreference.addEventListener("change", () => {
    document.documentElement.dataset.theme = getTheme()
})
