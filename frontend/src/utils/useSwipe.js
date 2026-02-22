import { useRef, useCallback } from 'react'

const THRESHOLD = 45    // px to commit a swipe
const MAX_SHIFT = 68    // rubber-band max during drag
const ANGLE_MAX = 35    // degrees from horizontal before we lock to scroll
const FLYOUT_MS = 210   // duration of the "fly out" exit animation
const SLIDEIN_MS = 310   // duration of the "slide in" enter animation
const EASE_OUT = 'cubic-bezier(0.32, 0.72, 0, 1)'   // snappy deceleration (spring-like)
const EASE_SPRING = 'cubic-bezier(0.22, 1, 0.36, 1)'   // overshot spring for entry

/**
 * useSwipe — iOS-style page carousel, zero React renders during drag.
 *
 * Gesture sequence:
 *   1. touchstart  → record start point, disable transition
 *   2. touchmove   → rubber-band translate via el.style (no setState)
 *   3. touchend    → commit:
 *        a) fly current content off-screen (FLYOUT_MS)
 *        b) call onLeft / onRight → React updates day + starts data fetch
 *        c) snap element to opposite edge (invisible, off-screen)
 *        d) spring-slide element to center (SLIDEIN_MS) — new content appears
 *
 * @param {Function} onLeft  — swipe left  (→ next day)
 * @param {Function} onRight — swipe right (→ prev day)
 */
export default function useSwipe(onLeft, onRight) {
    const elRef = useRef(null)
    const stateRef = useRef(null)
    const onLeftRef = useRef(onLeft)
    const onRightRef = useRef(onRight)

    onLeftRef.current = onLeft
    onRightRef.current = onRight

    // ── DOM helpers ──────────────────────────────────────
    const setStyle = (el, transition, transform, willChange) => {
        el.style.transition = transition
        el.style.transform = transform
        if (willChange !== undefined) el.style.willChange = willChange
    }

    const reflow = (el) => void el.offsetHeight   // force browser reflow

    // ── Core transition ──────────────────────────────────
    const commitSwipe = useCallback((direction) => {
        const el = elRef.current
        if (!el) return

        const W = el.offsetWidth || 375   // real element width

        if (direction === 'left') {
            // Phase 1: fly current content off to the left
            setStyle(el,
                `transform ${FLYOUT_MS}ms ${EASE_OUT}`,
                `translateX(-${W * 1.05}px)`,
                'transform'
            )
            setTimeout(() => {
                // Phase 2: React switches day (triggers re-render + data fetch)
                onLeftRef.current?.()

                // Phase 3: teleport element to RIGHT edge (off-screen, no transition)
                setStyle(el, 'none', `translateX(${W * 1.05}px)`)
                reflow(el)

                // Phase 4: spring slide in from right
                setStyle(el,
                    `transform ${SLIDEIN_MS}ms ${EASE_SPRING}`,
                    'translateX(0)',
                    'transform'
                )
                setTimeout(() => { el.style.willChange = '' }, SLIDEIN_MS + 20)
            }, FLYOUT_MS)

        } else {
            // Phase 1: fly content off to the right
            setStyle(el,
                `transform ${FLYOUT_MS}ms ${EASE_OUT}`,
                `translateX(${W * 1.05}px)`,
                'transform'
            )
            setTimeout(() => {
                // Phase 2: React switches day
                onRightRef.current?.()

                // Phase 3: teleport element to LEFT edge (off-screen)
                setStyle(el, 'none', `translateX(-${W * 1.05}px)`)
                reflow(el)

                // Phase 4: spring slide in from left
                setStyle(el,
                    `transform ${SLIDEIN_MS}ms ${EASE_SPRING}`,
                    'translateX(0)',
                    'transform'
                )
                setTimeout(() => { el.style.willChange = '' }, SLIDEIN_MS + 20)
            }, FLYOUT_MS)
        }
    }, [])

    // ── Touch handlers ───────────────────────────────────
    const onTouchStart = useCallback((e) => {
        const t = e.touches[0]
        stateRef.current = {
            startX: t.clientX,
            startY: t.clientY,
            locked: null,
            lastDx: 0,
        }
        const el = elRef.current
        if (el) {
            el.style.transition = 'none'
            el.style.willChange = 'transform'
        }
    }, [])

    const onTouchMove = useCallback((e) => {
        if (!stateRef.current) return
        const t = e.touches[0]
        const dx = t.clientX - stateRef.current.startX
        const dy = t.clientY - stateRef.current.startY

        // Lock to axis after 8px movement
        if (stateRef.current.locked === null) {
            if (Math.hypot(dx, dy) < 8) return
            const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI)
            stateRef.current.locked = angle > ANGLE_MAX ? 'vertical' : 'horizontal'
        }

        if (stateRef.current.locked !== 'horizontal') return

        // Rubber-band feel: fluid up to MAX_SHIFT, heavy past it
        const abs = Math.abs(dx)
        const shifted = abs <= MAX_SHIFT
            ? abs * 0.75
            : MAX_SHIFT * 0.75 + (abs - MAX_SHIFT) * 0.10
        const clamped = Math.sign(dx) * Math.min(shifted, MAX_SHIFT)

        stateRef.current.lastDx = clamped

        const el = elRef.current
        if (el) el.style.transform = clamped !== 0 ? `translateX(${clamped}px)` : ''
    }, [])

    const onTouchEnd = useCallback(() => {
        if (!stateRef.current) return
        const { locked, lastDx } = stateRef.current
        stateRef.current = null

        if (locked !== 'horizontal') return

        if (lastDx < -(THRESHOLD * 0.5)) {
            commitSwipe('left')
        } else if (lastDx > THRESHOLD * 0.5) {
            commitSwipe('right')
        } else {
            // Spring back — didn't reach threshold
            const el = elRef.current
            if (el) {
                setStyle(el,
                    'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    'translateX(0)',
                    ''
                )
            }
        }
    }, [commitSwipe])

    return {
        ref: elRef,
        handlers: { onTouchStart, onTouchMove, onTouchEnd },
    }
}
