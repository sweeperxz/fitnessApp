import React, { useState, useEffect } from 'react'
import { getRecentFoods, addRecentFood } from '../../api'
import { parseOFF } from '../../utils/openFoodFacts'

export default function SearchTab({ onSelect }) {
    const [q, setQ] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [recent, setRecent] = useState([])
    const [recentLoaded, setRecentLoaded] = useState(false)

    useEffect(() => {
        getRecentFoods()
            .then(d => { setRecent(d); setRecentLoaded(true) })
            .catch(() => { setRecent([]); setRecentLoaded(true) })
    }, [])

    const handleSelect = (item) => {
        addRecentFood(item).catch(() => { })
        onSelect(item)
    }

    useEffect(() => {
        const query = q.trim()
        if (query.length < 2) { setResults([]); setDone(false); return }

        const timer = setTimeout(async () => {
            setLoading(true); setDone(true)
            try {
                // Сначала ищем по Украине
                const r = await fetch(
                    `https://world.openfoodfacts.org/cgi/search.pl?` +
                    `search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=30` +
                    `&fields=product_name,product_name_ru,product_name_ua,brands,nutriments` +
                    `&tagtype_0=countries&tag_contains_0=contains&tag_0=ukraine`
                )
                const d = await r.json()
                let parsed = (d.products || []).map(parseOFF).filter(p => p.calories > 0).slice(0, 8)

                // Если пусто — глобальный поиск
                if (parsed.length === 0) {
                    const r2 = await fetch(
                        `https://world.openfoodfacts.org/cgi/search.pl?` +
                        `search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=20` +
                        `&fields=product_name,product_name_ru,product_name_ua,brands,nutriments`
                    )
                    const d2 = await r2.json()
                    parsed = (d2.products || []).map(parseOFF).filter(p => p.calories > 0).slice(0, 8)
                }
                setResults(parsed)
            } catch { setResults([]) }
            setLoading(false)
        }, 400)

        return () => clearTimeout(timer)
    }, [q])

    const isSearching = q.trim().length >= 2
    const list = isSearching ? results : recent

    return (
        <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                    className="input"
                    placeholder="Гречка, куриная грудка..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    style={{ flex: 1 }}
                />
                <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {loading
                        ? <div style={{ width: 16, height: 16, border: '2px solid var(--text3)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    }
                </div>
            </div>

            {!isSearching && recentLoaded && recent.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                    Недавние
                </div>
            )}

            {isSearching && loading && !results.length && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13 }}>Ищем...</div>
            )}
            {isSearching && !loading && done && !results.length && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>
                    Ничего не найдено.<br />Попробуй на русском или английском.
                </div>
            )}
            {!isSearching && recentLoaded && recent.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13, lineHeight: 1.7 }}>
                    Здесь появятся<br />твои недавние продукты
                </div>
            )}

            {list.map((item, i) => (
                <div key={i} onClick={() => handleSelect(item)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                        {item.brand && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.brand}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>
                            Б:{item.protein}г · Ж:{item.fat}г · У:{item.carbs}г
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--blue2)' }}>{item.calories}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>ккал/100г</div>
                    </div>
                </div>
            ))}
        </>
    )
}
