import { useCallback, useEffect, useState } from 'react'
import { sendChatMessage } from '../../../api'

const aiTipsCache = {}

export function useAiTips({ day, dayLabel, nutrition, profile }) {
  const dayStr = day.format('YYYY-MM-DD')
  const [tipsOpen, setTipsOpen] = useState(() => aiTipsCache[dayStr]?.open || false)
  const [aiTips, setAiTips] = useState(() => aiTipsCache[dayStr]?.tips || null)
  const [tipsLoading, setTipsLoading] = useState(false)

  useEffect(() => {
    const nextDayStr = day.format('YYYY-MM-DD')
    setAiTips(aiTipsCache[nextDayStr]?.tips || null)
    setTipsOpen(aiTipsCache[nextDayStr]?.open || false)
  }, [day])

  const loadAiTips = useCallback(async () => {
    if (aiTips || tipsLoading) return

    setTipsLoading(true)

    try {
      const prompt = `Ты строгий, но полезный ИИ-нутрициолог.
      Вот статистика пользователя за день (${dayLabel}):
      Калории: съедено ${Math.round(nutrition.total_calories)} из ${profile.calories_goal} ккал.
      Белки: ${Math.round(nutrition.total_protein)} из ${profile.protein_goal} г.
      Жиры: ${Math.round(nutrition.total_fat)} из ${profile.fat_goal} г.
      Углеводы: ${Math.round(nutrition.total_carbs)} из ${profile.carbs_goal} г.
      Вода: ${nutrition.water_ml} из ${profile.water_goal} мл.
      Приёмы пищи: ${nutrition.meals.map(m => m.name).join(', ') || 'Пока пусто'}.

      Твоя задача: Верни ТОЛЬКО JSON-массив из 3-х строк. Каждая строка - это короткий и персонализированный совет на текущий день, учитывая перебор или недобор КБЖУ. Без приветствий, без markdown, только валидный JSON.
      Пример: ["Отличный старт дня, но не хватает белков.", "Выпей еще стакан воды.", "На ужин лучше выбрать рыбу."]`

      const res = await sendChatMessage({ messages: [{ role: 'user', content: prompt }] })
      const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = raw.match(/\[[\s\S]*\]/)

      if (!jsonMatch) throw new Error('Failed to parse AI response')

      const tipsArray = JSON.parse(jsonMatch[0])
      setAiTips(tipsArray)

      const cacheKey = day.format('YYYY-MM-DD')
      aiTipsCache[cacheKey] = { ...(aiTipsCache[cacheKey] || {}), tips: tipsArray }
    } catch {
      const errTips = ['Не удалось загрузить советы от ИИ на данный момент. Попробуйте позже.']
      setAiTips(errTips)

      const cacheKey = day.format('YYYY-MM-DD')
      aiTipsCache[cacheKey] = { ...(aiTipsCache[cacheKey] || {}), tips: errTips }
    }

    setTipsLoading(false)
  }, [aiTips, day, dayLabel, nutrition, profile, tipsLoading])

  const toggleTips = useCallback(() => {
    const cacheKey = day.format('YYYY-MM-DD')

    if (!tipsOpen) {
      setTipsOpen(true)
      aiTipsCache[cacheKey] = { ...(aiTipsCache[cacheKey] || {}), open: true }
      loadAiTips()
      return
    }

    setTipsOpen(false)
    aiTipsCache[cacheKey] = { ...(aiTipsCache[cacheKey] || {}), open: false }
  }, [day, loadAiTips, tipsOpen])

  return {
    tipsOpen,
    aiTips,
    tipsLoading,
    toggleTips,
  }
}
