import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { getStats, getProfile } from '../api/index';
import { tapHaptic } from '../utils/haptic';
import { G } from '../utils/theme';

const PERIODS = [{ l: '7', d: 7 }, { l: '14', d: 14 }, { l: '30', d: 30 }];

export default function StatsPage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState(7);
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [chart, setChart] = useState('calories');
    const [loading, setLoading] = useState(false);

    const CHARTS = [
        { key: 'calories', label: t('stats.charts.calories'), color: '#FF9F0A', unit: 'ккал' },
        { key: 'protein', label: t('stats.charts.protein'), color: G.accentPurple, unit: 'г' },
        { key: 'water', label: t('stats.charts.water'), color: '#0EA5E9', unit: 'мл' },
        { key: 'workout', label: t('stats.charts.workout'), color: G.accentGreen, unit: '' },
    ];

    useEffect(() => {
        setLoading(true);
        Promise.all([getStats(period), getProfile().catch(() => null)])
            .then(([s, p]) => { setStats(s); setProfile(p); })
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [period]);

    const days = stats?.days || [];
    const active = days.filter(d => d.calories > 0);
    const hitRate = period > 0 ? Math.round(active.length / period * 100) : 0;
    const hitColor = hitRate >= 70 ? G.accentGreen : hitRate >= 40 ? '#fbbf24' : G.accentRed;
    const avgCal = active.length ? Math.round(active.reduce((a, d) => a + d.calories, 0) / active.length) : 0;
    const avgPro = active.length ? Math.round(active.reduce((a, d) => a + d.protein, 0) / active.length) : 0;
    const avgWat = active.length ? Math.round(active.reduce((a, d) => a + d.water_ml, 0) / active.length) : 0;
    const totWrk = days.reduce((a, d) => a + d.workout_count, 0);

    const fmt = dateStr => {
        const d = dayjs(dateStr);
        return period <= 7 ? d.format('dd') : d.format('D.M');
    };

    const chartData = days.map(d => {
        let val = 0;
        if (chart === 'calories') val = d.calories;
        if (chart === 'protein') val = d.protein;
        if (chart === 'water') val = d.water_ml;
        if (chart === 'workout') val = d.workout_count;
        return { day: fmt(d.day), val: Math.round(val), hasVal: d.calories > 0 };
    });

    const ac = CHARTS.find(c => c.key === chart);
    const hasData = chartData.some(d => d.val > 0);
    const maxVal = Math.max(1, ...chartData.map(d => d.val));

    return (
        <SafeAreaView style={s.safeArea}>
            <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
                <View style={s.header}>
                    <Text style={s.title}>{t('stats.title')}</Text>
                </View>

                {/* Period picker */}
                <View style={s.periodRow}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p.d}
                            style={[s.periodBtn, period === p.d && s.periodBtnActive]}
                            onPress={() => { tapHaptic(); setPeriod(p.d); }}
                        >
                            <Text style={[s.periodTxt, period === p.d && s.periodTxtActive]}>{t(`stats.periods.${p.d}`)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={s.loadingBox}>
                        <ActivityIndicator color={G.accent} size="large" />
                    </View>
                ) : (
                    <>
                        <View style={s.statsGrid}>
                            <View style={s.card}>
                                <Text style={s.cardLabel}>{t('stats.active_days')}</Text>
                                <View style={s.activeDaysRow}>
                                    <Text style={s.activeDaysVal}>{active.length}</Text>
                                    <Text style={s.activeDaysTotal}>/{period}</Text>
                                </View>
                                <View style={s.dotsWrap}>
                                    {days.map((d, i) => (
                                        <View key={i} style={[s.dot, { backgroundColor: d.calories > 0 ? G.accent : 'rgba(255,255,255,0.1)', width: period > 14 ? 6 : 9, height: period > 14 ? 6 : 9 }]} />
                                    ))}
                                </View>
                            </View>

                            <View style={s.card}>
                                <Text style={s.cardLabel}>{t('stats.hit_rate')}</Text>
                                <View style={s.activeDaysRow}>
                                    <Text style={[s.activeDaysVal, { color: hitColor }]}>{hitRate}</Text>
                                    <Text style={s.activeDaysTotal}>%</Text>
                                </View>
                                <View style={s.progressBg}>
                                    <View style={[s.progressFg, { width: `${hitRate}%`, backgroundColor: hitColor }]} />
                                </View>
                                <Text style={s.hitTip}>
                                    {hitRate >= 70 ? t('stats.hit_tips.great') : hitRate >= 40 ? t('stats.hit_tips.good') : t('stats.hit_tips.start')}
                                </Text>
                            </View>
                        </View>

                        <View style={s.cardFull}>
                            <Text style={s.cardLabel}>{t('stats.avg_stats')}</Text>
                            <View style={s.avgRow}>
                                {[
                                    { v: avgCal, l: 'ккал' },
                                    { v: avgPro + 'г', l: t('today.protein').slice(0, 4) },
                                    { v: Math.round(avgWat / 100) / 10 + 'л', l: t('today.water').slice(0, 4) },
                                    { v: totWrk, l: t('stats.charts.workout').slice(0, 4) },
                                ].map((st, i) => (
                                    <View key={i} style={s.avgBox}>
                                        <Text style={s.avgVal}>{st.v}</Text>
                                        <Text style={s.avgLbl}>{st.l}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chartSelectRow} contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingBottom: 16 }}>
                            {CHARTS.map(c => (
                                <TouchableOpacity
                                    key={c.key}
                                    style={[s.chartBtn, chart === c.key && { backgroundColor: `${c.color}22`, borderColor: c.color }]}
                                    onPress={() => { tapHaptic(); setChart(c.key); }}
                                >
                                    <Text style={[s.chartBtnTxt, { color: chart === c.key ? c.color : G.textSecondary }]}>{c.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={[s.cardFull, { marginHorizontal: 16, marginBottom: 16 }]}>
                            {!hasData ? (
                                <View style={s.chartEmpty}>
                                    <Text style={{ fontSize: 24, marginBottom: 8 }}>📊</Text>
                                    <Text style={s.chartEmptyTxt}>{t('stats.no_data')}</Text>
                                </View>
                            ) : (
                                <View style={s.chartContainer}>
                                    <View style={s.barsArea}>
                                        {chartData.map((d, i) => {
                                            const h = (d.val / maxVal) * 100;
                                            return (
                                                <View key={i} style={s.barWrap}>
                                                    <View style={s.barBg}>
                                                        <View style={[s.barFill, { height: `${h}%`, backgroundColor: ac.color }]} />
                                                    </View>
                                                    <Text style={s.barLbl} numberOfLines={1}>{d.day}</Text>
                                                    {d.val > 0 && period <= 14 && (
                                                        <Text style={[s.barVal, { color: ac.color }]}>{d.val}</Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={[s.cardFull, { marginHorizontal: 16, marginBottom: 100 }]}>
                            <Text style={s.cardLabel}>{t('stats.streak')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <Text style={s.streakVal}>{stats?.streak || 0}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.streakLbl}>{t('stats.days_streak')}</Text>
                                    <Text style={s.streakSub}>
                                        {(stats?.streak || 0) >= 7 ? t('stats.streak_tips.great') : (stats?.streak || 0) >= 3 ? t('stats.streak_tips.good') : t('stats.streak_tips.start')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: G.bg },
    container: { paddingVertical: 16 },
    header: { paddingHorizontal: 16, marginBottom: 20 },
    title: { fontSize: 26, fontWeight: '800', letterSpacing: -1, color: G.textPrimary },
    periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
    periodBtn: { flex: 1, paddingVertical: 12, backgroundColor: G.bgCard, borderRadius: G.radiusXs, borderWidth: 1, borderColor: G.bgCardBorder, alignItems: 'center' },
    periodBtnActive: { backgroundColor: G.bgChipActive, borderColor: 'rgba(0,122,255,0.5)' },
    periodTxt: { fontSize: 14, fontWeight: '700', color: G.textSecondary },
    periodTxtActive: { color: G.accent },
    loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
    card: { flex: 1, backgroundColor: G.bgCard, borderRadius: G.radius, padding: 16, borderWidth: 1, borderColor: G.bgCardBorder },
    cardLabel: { fontSize: 13, fontWeight: '700', color: G.textSecondary, textTransform: 'uppercase', marginBottom: 12 },
    activeDaysRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
    activeDaysVal: { fontSize: 36, fontWeight: '800', color: G.accent, lineHeight: 40 },
    activeDaysTotal: { fontSize: 18, fontWeight: '600', color: G.textSecondary, marginLeft: 2 },
    dotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    dot: { borderRadius: 3 },
    progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressFg: { height: '100%', borderRadius: 3 },
    hitTip: { fontSize: 11, color: G.textSecondary, lineHeight: 16 },
    cardFull: { backgroundColor: G.bgCard, borderRadius: G.radius, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: G.bgCardBorder },
    avgRow: { flexDirection: 'row', gap: 8 },
    avgBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: G.radiusXs, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center' },
    avgVal: { fontSize: 18, fontWeight: '800', color: G.textPrimary, marginBottom: 4 },
    avgLbl: { fontSize: 10, fontWeight: '700', color: G.textSecondary, textTransform: 'uppercase' },
    chartSelectRow: { maxHeight: 44, marginBottom: 16 },
    chartBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: G.bgChip, borderWidth: 1, borderColor: G.bgCardBorder, marginRight: 8 },
    chartBtnTxt: { fontSize: 13, fontWeight: '600' },
    chartEmpty: { height: 180, alignItems: 'center', justifyContent: 'center' },
    chartEmptyTxt: { fontSize: 14, color: G.textSecondary, fontWeight: '500' },
    chartContainer: { height: 180, paddingTop: 20 },
    barsArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 24 },
    barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barBg: { flex: 1, width: '60%', maxWidth: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
    barFill: { width: '100%', borderRadius: 4 },
    barLbl: { fontSize: 9, color: G.textSecondary, marginTop: 8, height: 12 },
    barVal: { position: 'absolute', top: -16, fontSize: 9, fontWeight: '700' },
    streakVal: { fontSize: 56, fontWeight: '800', color: G.accent, lineHeight: 60 },
    streakLbl: { fontSize: 16, fontWeight: '700', color: G.textPrimary, marginBottom: 4 },
    streakSub: { fontSize: 13, color: G.textSecondary, lineHeight: 18 },
});
