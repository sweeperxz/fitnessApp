import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import * as Network from 'expo-network';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, WifiOff, X } from 'lucide-react-native';

import { getNutritionDay, addMeal, deleteMeal, logWater, getProfile, sendChatMessage } from '../api/index';
import { tapHaptic, mediumHaptic, successHaptic } from '../utils/haptic';
import { MEAL_TYPES, MealIcons } from '../utils/constants';
import { G } from '../utils/theme';
import Ring from '../components/Ring';
import AddModal from '../components/AddMeal/AddModal';

dayjs.locale('ru');

const globalAiTipsCache = {};

export default function TodayPage() {
    const { t, i18n } = useTranslation();
    const [day, setDay] = useState(dayjs());
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [modal, setModal] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const initDateStr = dayjs().format('YYYY-MM-DD');
    const [tipsOpen, setTipsOpen] = useState(() => globalAiTipsCache[initDateStr]?.open || false);
    const [aiTips, setAiTips] = useState(() => globalAiTipsCache[initDateStr]?.tips || null);
    const [tipsLoading, setTipsLoading] = useState(false);

    const fb = { calories_goal: 2000, protein_goal: 150, fat_goal: 70, carbs_goal: 250, water_goal: 2500 };

    const load = useCallback(async () => {
        try {
            const [nd, pr] = await Promise.all([
                getNutritionDay(day.format('YYYY-MM-DD')),
                getProfile().catch(() => fb),
            ]);
            setData(nd);
            setProfile(pr);
            setIsOffline(false);
        } catch (err) {
            setIsOffline(true);
            setData({ meals: [], total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, water_ml: 0 });
            setProfile(fb);
        }
    }, [day]);

    useEffect(() => { load(); }, [load]);

    const isOfflineRef = React.useRef(isOffline);
    useEffect(() => { isOfflineRef.current = isOffline; }, [isOffline]);

    useEffect(() => {
        let active = true;
        const check = async () => {
            if (!active) return;
            const net = await Network.getNetworkStateAsync();
            const offline = !(net.isConnected && net.isInternetReachable);
            if (isOfflineRef.current !== offline) {
                setIsOffline(offline);
                if (!offline) load();
            }
        };
        const inv = setInterval(check, 15000);
        check();
        return () => { active = false; clearInterval(inv); };
    }, [load]); // removed isOffline from deps — use ref instead to avoid respawning interval

    useEffect(() => {
        const dStr = day.format('YYYY-MM-DD');
        setAiTips(globalAiTipsCache[dStr]?.tips || null);
        setTipsOpen(globalAiTipsCache[dStr]?.open || false);
    }, [day]);

    const pr = profile || fb;
    const d = data || { meals: [], total_calories: 0, total_protein: 0, total_fat: 0, total_carbs: 0, water_ml: 0 };
    const remaining = Math.max(pr.calories_goal - d.total_calories, 0);
    const waterPct = Math.min((d.water_ml / pr.water_goal) * 100, 100);
    const isToday = day.isSame(dayjs(), 'day');
    const dayLabel = isToday
        ? t('common.today')
        : day.isSame(dayjs().subtract(1, 'day'), 'day')
            ? t('common.yesterday')
            : day.locale(i18n.language).format('D MMMM');

    const groups = useMemo(() =>
        MEAL_TYPES.map(t => ({ type: t, items: d.meals.filter(m => m.meal_type === t) })).filter(g => g.items.length > 0),
        [d.meals]
    );

    const macros = useMemo(() => [
        { l: t('today.protein'), v: d.total_protein, g: pr.protein_goal, c: G.accentPurple },
        { l: t('today.fat'), v: d.total_fat, g: pr.fat_goal, c: G.accentOrange },
        { l: t('today.carbs'), v: d.total_carbs, g: pr.carbs_goal, c: G.accentGreen },
    ], [d.total_protein, d.total_fat, d.total_carbs, pr.protein_goal, pr.fat_goal, pr.carbs_goal, t]);

    const loadAiTips = async () => {
        if (aiTips || tipsLoading) return;
        setTipsLoading(true);
        try {
            const prompt = `Ты строгий, но полезный ИИ-нутрициолог. 
Вот статистика пользователя за день (${dayLabel}):
Калории: съедено ${Math.round(d.total_calories)} из ${pr.calories_goal} ккал.
Белки: ${Math.round(d.total_protein)} из ${pr.protein_goal} г.
Жиры: ${Math.round(d.total_fat)} из ${pr.fat_goal} г.
Углеводы: ${Math.round(d.total_carbs)} из ${pr.carbs_goal} г.
Вода: ${d.water_ml} из ${pr.water_goal} мл.
Приёмы пищи: ${d.meals.map(m => m.name).join(', ') || 'Пока пусто'}.

Верни ТОЛЬКО JSON-массив из 3-х строк. Каждая строка - это короткий совет. Без markdown.`;

            const res = await sendChatMessage({ messages: [{ role: 'user', content: prompt }] });
            const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Failed to parse');
            const tipsArray = JSON.parse(jsonMatch[0]);

            setAiTips(tipsArray);
            const dStr = day.format('YYYY-MM-DD');
            globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), tips: tipsArray };
        } catch (e) {
            const errTips = ["Не удалось загрузить советы. Попробуйте позже."];
            setAiTips(errTips);
            const dStr = day.format('YYYY-MM-DD');
            globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), tips: errTips };
        }
        setTipsLoading(false);
    };

    const handleToggleTips = () => {
        tapHaptic();
        const dStr = day.format('YYYY-MM-DD');
        if (!tipsOpen) {
            setTipsOpen(true);
            globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), open: true };
            loadAiTips();
        } else {
            setTipsOpen(false);
            globalAiTipsCache[dStr] = { ...(globalAiTipsCache[dStr] || {}), open: false };
        }
    };

    return (
        <SafeAreaView style={s.safeArea}>
            <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.title}>Nut<Text style={{ color: G.accent }}>rio</Text></Text>
                    <View style={s.navRow}>
                        <TouchableOpacity style={s.navBtn} onPress={() => { tapHaptic(); setDay(d => d.subtract(1, 'day')); }}>
                            <ChevronLeft color={G.accent} size={20} />
                        </TouchableOpacity>
                        <Text style={s.navDate}>{dayLabel}</Text>
                        <TouchableOpacity style={s.navBtn} onPress={() => { tapHaptic(); setDay(d => d.add(1, 'day')); }}>
                            <ChevronRight color={G.accent} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Macro Card */}
                <View style={s.card}>
                    {!data ? (
                        <ActivityIndicator color={G.accent} style={{ padding: 40 }} />
                    ) : (
                        <>
                            <View style={s.ringRow}>
                                <Ring eaten={d.total_calories} goal={pr.calories_goal} />
                                <View style={s.macroList}>
                                    {macros.map(m => (
                                        <View key={m.l} style={s.macroItem}>
                                            <View style={s.macroHeader}>
                                                <Text style={s.macroName}>{m.l}</Text>
                                                <Text style={s.macroVal}>{Math.round(m.v)} <Text style={s.macroGoal}>/{m.g}г</Text></Text>
                                            </View>
                                            <View style={s.macroTrack}>
                                                <View style={[s.macroFill, { width: `${Math.min((m.v / m.g) * 100, 100)}%`, backgroundColor: m.c }]} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={s.summaryRow}>
                                {[
                                    { l: t('today.eaten'), v: Math.round(d.total_calories), c: G.accent },
                                    { l: t('today.goal'), v: pr.calories_goal, c: G.textPrimary },
                                    { l: t('today.remaining'), v: remaining, c: remaining === 0 ? G.accentRed : G.accentGreen },
                                ].map(ss => (
                                    <View key={ss.l} style={s.summaryItem}>
                                        <Text style={s.summaryLbl}>{ss.l}</Text>
                                        <Text style={[s.summaryVal, { color: ss.c }]}>{ss.v}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* Water Card */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>{t('today.water')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 12 }}>
                        <Text style={s.waterAmt}>{d.water_ml}</Text>
                        <Text style={s.waterGoal}>/ {pr.water_goal} {t('today.ml')}</Text>
                    </View>
                    <View style={s.waterTrack}>
                        <View style={[s.waterFill, { width: `${waterPct}%` }]} />
                    </View>
                    <View style={s.waterBtns}>
                        {[100, 200, 250, 500].map(ml => (
                            <TouchableOpacity key={ml} style={s.waterBtn} onPress={() => {
                                tapHaptic();
                                logWater({ day: day.format('YYYY-MM-DD'), amount_ml: ml }).then(() => { successHaptic(); load(); });
                            }}>
                                <Text style={s.waterBtnTxt}>+{ml}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* AI Tips */}
                <View style={s.tipsCard}>
                    <TouchableOpacity style={s.tipsHeader} onPress={handleToggleTips}>
                        <View style={s.tipsTitleRow}>
                            <Text style={s.tipsEmoji}>✨</Text>
                            <Text style={s.tipsTitle}>{t('today.ai_tips')}</Text>
                        </View>
                        {tipsLoading
                            ? <ActivityIndicator size="small" color={G.accent} />
                            : tipsOpen
                                ? <ChevronUp color={G.textSecondary} size={20} />
                                : <ChevronDown color={G.textSecondary} size={20} />}
                    </TouchableOpacity>
                    {tipsOpen && (
                        <View style={s.tipsContent}>
                            {aiTips ? (
                                aiTips.map((tip, i) => (
                                    <View key={i} style={s.tipRow}>
                                        <View style={s.tipDot} />
                                        <Text style={s.tipTxt}>{tip}</Text>
                                    </View>
                                ))
                            ) : tipsLoading ? (
                                <Text style={s.tipWait}>{t('today.generating_tips')}</Text>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Meals */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>{t('today.meals')}</Text>
                    {isOffline ? (
                        <View style={s.emptyBox}>
                            <WifiOff color={G.textSecondary} size={32} style={{ marginBottom: 12 }} />
                            <Text style={s.emptyTitle}>{t('common.offline')}</Text>
                            <Text style={s.emptySub}>{t('common.offline_desc')}</Text>
                        </View>
                    ) : groups.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Text style={s.emptyEmoji}>🍽</Text>
                            <Text style={s.emptyTitle}>{t('today.empty_meals')}</Text>
                            <Text style={s.emptySub}>{t('today.empty_meals_desc')}</Text>
                        </View>
                    ) : groups.map(g => (
                        <View key={g.type}>
                            <Text style={s.mealGroupLbl}>{t(`meals.${g.type}`)}</Text>
                            {g.items.map(m => (
                                <View key={m.id} style={s.mealItem}>
                                    <View style={s.mealIconBox}>
                                        <Text style={s.mealEmoji}>{MealIcons[g.type]?.props?.children || '🍳'}</Text>
                                    </View>
                                    <View style={s.mealInfo}>
                                        <Text style={s.mealName}>{m.name}</Text>
                                        <Text style={s.mealMacros}>Б:{m.protein} · Ж:{m.fat} · У:{m.carbs} · <Text style={{ color: G.accent, fontWeight: 'bold' }}>{m.calories} ккал</Text></Text>
                                    </View>
                                    <TouchableOpacity style={s.mealDel} onPress={() => { mediumHaptic(); deleteMeal(m.id).then(load); }}>
                                        <X color={G.textSecondary} size={16} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity style={s.fab} onPress={() => { mediumHaptic(); setModal(true); }}>
                <Plus color="#fff" size={28} />
            </TouchableOpacity>

            <AddModal
                visible={modal}
                onClose={() => setModal(false)}
                onAdd={meal => {
                    successHaptic();
                    return addMeal({ ...meal, day: day.format('YYYY-MM-DD') }).then(load);
                }}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: G.bg },
    container: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 26, fontWeight: '800', letterSpacing: -1, color: G.textPrimary },
    navRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4 },
    navBtn: { padding: 4 },
    navDate: { fontSize: 13, fontWeight: '600', color: G.accent, marginHorizontal: 8 },
    card: { backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: G.radius, padding: 16, marginBottom: 16 },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    macroList: { flex: 1, gap: 10 },
    macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    macroName: { fontSize: 11, fontWeight: '600', color: G.textSecondary, textTransform: 'uppercase' },
    macroVal: { fontSize: 13, fontWeight: '700', color: G.textPrimary },
    macroGoal: { color: G.textSecondary, fontWeight: '400' },
    macroTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    macroFill: { height: '100%', borderRadius: 3 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: G.bgCardBorder, marginTop: 16, paddingTop: 16 },
    summaryItem: { alignItems: 'center' },
    summaryLbl: { fontSize: 10, fontWeight: '700', color: G.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    summaryVal: { fontSize: 18, fontWeight: '800' },
    cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, color: G.textPrimary },
    waterAmt: { fontSize: 32, fontWeight: '800', color: G.accent },
    waterGoal: { fontSize: 14, color: G.textSecondary, marginBottom: 4 },
    waterTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 16 },
    waterFill: { height: '100%', backgroundColor: G.accent, borderRadius: 4 },
    waterBtns: { flexDirection: 'row', gap: 8 },
    waterBtn: { flex: 1, backgroundColor: G.bgChipActive, paddingVertical: 10, borderRadius: G.radiusXs, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,122,255,0.3)' },
    waterBtnTxt: { color: G.accent, fontWeight: '700', fontSize: 14 },
    tipsCard: { backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: G.radiusSm, padding: 16, marginBottom: 16 },
    tipsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tipsEmoji: { fontSize: 16 },
    tipsTitle: { fontSize: 15, fontWeight: '700', color: G.textPrimary },
    tipsContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: G.bgCardBorder },
    tipRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 10 },
    tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: G.accent, marginTop: 6, marginRight: 8 },
    tipTxt: { fontSize: 13, color: G.textSecondary, lineHeight: 18, flex: 1 },
    tipWait: { textAlign: 'center', fontSize: 13, color: G.textSecondary, paddingVertical: 8 },
    emptyBox: { alignItems: 'center', paddingVertical: 30 },
    emptyEmoji: { fontSize: 32, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: G.textPrimary, marginBottom: 4 },
    emptySub: { fontSize: 13, color: G.textSecondary, textAlign: 'center' },
    mealGroupLbl: { fontSize: 13, fontWeight: '700', color: G.textSecondary, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
    mealItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: G.radiusXs, marginBottom: 8, borderWidth: 1, borderColor: G.bgCardBorder },
    mealIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    mealEmoji: { fontSize: 18 },
    mealInfo: { flex: 1 },
    mealName: { fontSize: 15, fontWeight: '600', color: G.textPrimary, marginBottom: 2 },
    mealMacros: { fontSize: 12, color: G.textSecondary },
    mealDel: { padding: 8 },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center', shadowColor: G.accent, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
});
