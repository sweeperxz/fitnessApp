/**
 * haptic.js — Simple haptic feedback utility
 *
 * Uses Vibration API when available (Android, some PWAs).
 * No-op on devices without support (iOS Safari, desktop).
 */

/** Light tap — buttons, toggles, chips */
export function tapHaptic() {
    if (navigator.vibrate) navigator.vibrate(12)
}

/** Medium tap — FAB, important actions */
export function mediumHaptic() {
    if (navigator.vibrate) navigator.vibrate(18)
}

/** Success — save confirmed, sync done */
export function successHaptic() {
    if (navigator.vibrate) navigator.vibrate([15, 60, 15])
}

/** Error / warning */
export function errorHaptic() {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
}
