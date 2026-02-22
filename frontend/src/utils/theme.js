/**
 * theme.js — Light/dark theme manager
 *
 * Stores preference in localStorage ('nutrio_theme').
 * Applies via data-theme="light" attribute on <html>.
 * Default: dark (matches current design).
 */

const STORAGE_KEY = 'nutrio_theme'

export function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark'
}

export function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
}

export function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    return next
}

export function applyTheme(theme) {
    const current = theme || getTheme()
    document.documentElement.setAttribute('data-theme', current)

    // Sync PWA status bar / browser chrome color
    const bgColor = current === 'light' ? '#f2f2f7' : '#000000'
    let metaTheme = document.querySelector('meta[name="theme-color"]')
    if (!metaTheme) {
        metaTheme = document.createElement('meta')
        metaTheme.name = 'theme-color'
        document.head.appendChild(metaTheme)
    }
    metaTheme.content = bgColor
}

// Apply on first import
applyTheme()
