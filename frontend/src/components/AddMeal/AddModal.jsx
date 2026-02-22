import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import SearchTab from './SearchTab'
import BarcodeTab from './BarcodeTab'
import ManualTab from './ManualTab'
import AiTab from './AiTab'

const TABS = ['Поиск', 'Штрихкод', 'Вручную', 'AI Расчёт']

export default function AddModal({ onClose, onAdd }) {
    const [tab, setTab] = useState(0)
    const [selected, setSelected] = useState(null)

    // После выбора продукта из поиска или сканера — переходим в "Вручную" с заполненными полями
    const pick = (item) => {
        setSelected(item)
        setTab(2)
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-handle" />
                <div className="modal-title">Добавить блюдо</div>

                <div className="food-tabs" style={{ flexShrink: 0 }}>
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            className={`food-tab${tab === i ? ' active' : ''}`}
                            onClick={() => { setTab(i); setSelected(null) }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div style={{
                    overflowY: 'auto', flex: 1,
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                }}>
                    {tab === 0 && <SearchTab onSelect={pick} />}
                    {tab === 1 && <BarcodeTab onSelect={pick} />}
                    {tab === 2 && (
                        <ManualTab
                            initial={selected ? {
                                name: selected.name + (selected.brand ? ` (${selected.brand})` : ''),
                                calories: selected.calories,
                                protein: selected.protein,
                                fat: selected.fat,
                                carbs: selected.carbs,
                            } : null}
                            onAdd={onAdd}
                            onClose={onClose}
                        />
                    )}
                    {tab === 3 && <AiTab onSelect={pick} />}
                </div>
            </div>
        </div>,
        document.body
    )
}
