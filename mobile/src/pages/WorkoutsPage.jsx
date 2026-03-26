import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import { getWorkouts, createWorkout, deleteWorkout } from '../api/index';
import { tapHaptic, mediumHaptic, successHaptic } from '../utils/haptic';
import { ChevronRight, ChevronLeft, Plus, X, Check, WifiOff } from 'lucide-react-native';
import { G } from '../utils/theme';

const MUSCLE_KEYS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio'];
const DB = [
  { n: 'Жим лёжа', m: 'Chest' }, { n: 'Разводка гантелями', m: 'Chest' }, { n: 'Отжимания', m: 'Chest' }, { n: 'Кроссовер', m: 'Chest' },
  { n: 'Тяга верхнего блока', m: 'Back' }, { n: 'Тяга штанги в наклоне', m: 'Back' }, { n: 'Становая тяга', m: 'Back' }, { n: 'Подтягивания', m: 'Back' }, { n: 'Гиперэкстензия', m: 'Back' },
  { n: 'Приседания со штангой', m: 'Legs' }, { n: 'Жим ногами', m: 'Legs' }, { n: 'Выпады', m: 'Legs' }, { n: 'Сгибание ног', m: 'Legs' }, { n: 'Разгибание ног', m: 'Legs' }, { n: 'Подъём на носки', m: 'Legs' },
  { n: 'Жим гантелей сидя', m: 'Shoulders' }, { n: 'Армейский жим', m: 'Shoulders' }, { n: 'Махи в стороны', m: 'Shoulders' }, { n: 'Тяга к подбородку', m: 'Shoulders' },
  { n: 'Подъём штанги на бицепс', m: 'Biceps' }, { n: 'Молотковые сгибания', m: 'Biceps' },
  { n: 'Жим узким хватом', m: 'Triceps' }, { n: 'Разгибания на блоке', m: 'Triceps' }, { n: 'Французский жим', m: 'Triceps' },
  { n: 'Скручивания', m: 'Abs' }, { n: 'Планка', m: 'Abs' }, { n: 'Подъём ног', m: 'Abs' },
  { n: 'Бег', m: 'Cardio' }, { n: 'Скакалка', m: 'Cardio' }, { n: 'Велотренажёр', m: 'Cardio' }, { n: 'Эллипс', m: 'Cardio' },
];
const MCOLORS = { Chest: '#a78bfa', Back: '#38bdf8', Legs: '#fbbf24', Shoulders: '#fb923c', Biceps: '#34d399', Triceps: '#007AFF', Abs: '#f43f5e', Cardio: '#ec4899' };

function getWeek(base) {
  const start = base.startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

function LibrarySheet({ visible, onAdd, onClose }) {
  const { t } = useTranslation();
  const [muscle, setMuscle] = useState('All');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState([]);

  const filtered = DB.filter(e => (muscle === 'All' || e.m === muscle) && e.n.toLowerCase().includes(search.toLowerCase()));
  const toggle = e => { tapHaptic(); setSel(a => a.find(x => x.n === e.n) ? a.filter(x => x.n !== e.n) : [...a, e]); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.modalSafe}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <View style={s.handle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={s.modalTitle}>{t('workouts.lib.title')}</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}><X color={G.textSecondary} size={24} /></TouchableOpacity>
            </View>
          </View>

          <TextInput style={s.input} placeholder={t('workouts.lib.search')} placeholderTextColor={G.textTertiary} value={search} onChangeText={setSearch} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {MUSCLE_KEYS.map(m => (
              <TouchableOpacity key={m} style={[s.chip, muscle === m && s.chipActive]} onPress={() => setMuscle(m)}>
                <Text style={[s.chipTxt, muscle === m && s.chipTxtActive]}>{t(`workouts.lib.muscles.${m}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={s.libList} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            {filtered.map(e => {
              const active = sel.some(x => x.n === e.n);
              return (
                <TouchableOpacity key={e.n} style={s.libItem} onPress={() => toggle(e)}>
                  <View style={[s.libIcon, { backgroundColor: MCOLORS[e.m] || G.textSecondary }]} />
                  <View style={s.libInfo}>
                    <Text style={[s.libName, active && { color: G.accent }]}>{e.n}</Text>
                    <Text style={s.libMuscle}>{t(`workouts.lib.muscles.${e.m}`)}</Text>
                  </View>
                  <View style={[s.libCheck, active && s.libCheckActive]}>
                    {active && <Check color="#fff" size={14} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {sel.length > 0 && (
            <View style={s.libFooter}>
              <TouchableOpacity style={s.btnPrimary} onPress={() => { onAdd(sel); onClose(); setSel([]); }}>
                <Text style={s.btnTxt}>{t('workouts.lib.add_btn', { count: sel.length })}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function NewWorkoutSheet({ visible, onClose, onSave, day }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [libVisible, setLibVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const addFromLib = list => setExercises(prev => {
    const ex = new Set(prev.map(e => e.name));
    return [...prev, ...list.filter(e => !ex.has(e.n)).map(e => ({ name: e.n, sets: '3', reps: '10', weight_kg: '0' }))];
  });
  const upd = (i, k, v) => setExercises(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex));
  const remove = i => setExercises(e => e.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const validExercises = exercises
        .filter(e => e.name.trim())
        .map(ex => ({ name: ex.name, sets: Number(ex.sets), reps: Number(ex.reps), weight_kg: Number(ex.weight_kg) }));
      await onSave({ title: title || t('workouts.add.title'), day: day.format('YYYY-MM-DD'), notes, exercises: validExercises.length > 0 ? validExercises : undefined });
      setExercises([]); setTitle(''); setNotes(''); onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.modalSafe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={s.handle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
                <Text style={s.modalDate}>{day.format('D MMMM')}</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}><X color={G.textSecondary} size={24} /></TouchableOpacity>
              </View>
            </View>

            <ScrollView style={s.formScroll} contentContainerStyle={{ padding: 16 }}>
              <Text style={s.lbl}>{t('workouts.add.name_label')}</Text>
              <TextInput style={s.input} placeholder={t('workouts.add.title')} placeholderTextColor={G.textTertiary} value={title} onChangeText={setTitle} />

              <View style={s.addExRow}>
                <TouchableOpacity style={[s.btnPrimary, { flex: 2 }]} onPress={() => setLibVisible(true)}>
                  <Text style={s.btnTxt}>{t('workouts.add.from_lib')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnOutline, { flex: 1, marginLeft: 8 }]} onPress={() => setExercises(e => [...e, { name: '', sets: '3', reps: '10', weight_kg: '0' }])}>
                  <Text style={s.btnOutlineTxt}>{t('workouts.add.manual')}</Text>
                </TouchableOpacity>
              </View>

              {exercises.length === 0 ? (
                <Text style={s.emptyTxt}>{t('workouts.add.choose_ex')}</Text>
              ) : exercises.map((ex, i) => (
                <View key={i} style={s.exCard}>
                  <View style={s.exHeader}>
                    <TextInput style={[s.input, { flex: 1, marginBottom: 0, marginHorizontal: 0 }]} placeholder={t('workouts.lib.search')} placeholderTextColor={G.textTertiary} value={ex.name} onChangeText={v => upd(i, 'name', v)} />
                    <TouchableOpacity onPress={() => remove(i)} style={s.exDelBtn}><X color={G.textSecondary} size={20} /></TouchableOpacity>
                  </View>
                  <View style={s.exGrid}>
                    {[['sets', ex.sets], ['reps', ex.reps], ['kg', ex.weight_kg]].map(([key, val]) => (
                      <View key={key} style={s.exCol}>
                        <Text style={s.exLbl}>{t(`workouts.add.${key}`)}</Text>
                        <TextInput style={s.exInput} keyboardType="numeric" value={val} onChangeText={v => upd(i, key === 'kg' ? 'weight_kg' : key, v)} textAlign="center" />
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              <Text style={[s.lbl, { marginTop: 16 }]}>{t('workouts.add.notes')}</Text>
              <TextInput style={[s.input, { minHeight: 80 }]} multiline value={notes} onChangeText={setNotes} textAlignVertical="top" placeholderTextColor={G.textTertiary} />
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity style={s.btnPrimary} onPress={save} disabled={saving}>
                <Text style={s.btnTxt}>{saving ? t('workouts.add.saving') : t('workouts.add.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <LibrarySheet visible={libVisible} onAdd={addFromLib} onClose={() => setLibVisible(false)} />
    </Modal>
  );
}

export default function WorkoutsPage() {
  const { t } = useTranslation();
  const [week, setWeek] = useState(dayjs());
  const [day, setDay] = useState(dayjs());
  const [workouts, setWorkouts] = useState([]);
  const [modal, setModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const wd = getWeek(week);

  const load = useCallback(async () => {
    try {
      setWorkouts(await getWorkouts({ from_date: wd[0].format('YYYY-MM-DD'), to_date: wd[6].format('YYYY-MM-DD') }));
      setIsOffline(false);
    } catch (err) {
      setIsOffline(true); setWorkouts([]);
    }
  }, [week]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!active) return;
      const tState = await Network.getNetworkStateAsync();
      const offline = !(tState.isConnected && tState.isInternetReachable);
      if (isOffline !== offline) { setIsOffline(offline); if (!offline) load(); }
    };
    const inv = setInterval(check, 10000);
    check();
    return () => { active = false; clearInterval(inv); };
  }, [load, isOffline]);

  const dayWo = workouts.filter(w => w.day === day.format('YYYY-MM-DD'));
  const hasWo = d => workouts.some(w => w.day === d.format('YYYY-MM-DD'));
  const totSets = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets, 0), 0);
  const totTons = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets * e.reps * e.weight_kg / 1000, 0), 0);

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t('workouts.title')}</Text>
        </View>

        <View style={s.statsRow}>
          {[
            { v: workouts.length, l: t('workouts.stats.count') },
            { v: totSets, l: t('workouts.stats.sets') },
            { v: totTons.toFixed(1) + 'т', l: t('workouts.stats.volume') },
          ].map(st => (
            <View key={st.l} style={s.statCard}>
              <Text style={s.statVal}>{st.v}</Text>
              <Text style={s.statLbl}>{st.l}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.weekNav}>
            <TouchableOpacity style={s.weekBtn} onPress={() => { tapHaptic(); setWeek(w => w.subtract(1, 'week')); }}>
              <ChevronLeft color={G.accent} size={20} />
            </TouchableOpacity>
            <Text style={s.weekLabel}>{wd[0].format('D')} – {wd[6].format('D MMM')}</Text>
            <TouchableOpacity style={s.weekBtn} onPress={() => { tapHaptic(); setWeek(w => w.add(1, 'week')); }}>
              <ChevronRight color={G.accent} size={20} />
            </TouchableOpacity>
          </View>
          <View style={s.weekStrip}>
            {wd.map(d => {
              const active = d.isSame(day, 'day');
              return (
                <TouchableOpacity key={d.format('D')} style={[s.weekDay, active && s.weekDayActive]} onPress={() => { tapHaptic(); setDay(d); }}>
                  <Text style={[s.wdName, active && s.wdActiveTxt]}>{d.format('dd').toUpperCase()}</Text>
                  <Text style={[s.wdNum, active && s.wdActiveTxt]}>{d.format('D')}</Text>
                  {hasWo(d) && <View style={[s.wdDot, active && { backgroundColor: '#fff' }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isOffline ? (
          <View style={s.emptyBox}>
            <WifiOff color={G.textSecondary} size={32} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>{t('common.offline')}</Text>
            <Text style={s.emptySub}>{t('common.offline_desc')}</Text>
          </View>
        ) : dayWo.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🏋️</Text>
            <Text style={s.emptyTitle}>{t('workouts.empty.title')}</Text>
            <Text style={s.emptySub}>{t('workouts.empty.text', { date: day.format('D MMMM') })}</Text>
          </View>
        ) : dayWo.map(w => (
          <View key={w.id} style={s.card}>
            <View style={s.woHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.woTitle}>{w.title}</Text>
                {w.notes ? <Text style={s.woNotes}>{w.notes}</Text> : null}
              </View>
              <TouchableOpacity style={s.exDelBtn} onPress={() => { mediumHaptic(); deleteWorkout(w.id).then(() => { successHaptic(); load(); }); }}>
                <X color={G.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
            {w.exercises.map(e => (
              <View key={e.id} style={s.rowEx}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowExName}>{e.name}</Text>
                  <Text style={s.rowExMeta}>{e.sets} × {e.reps} {t('workouts.add.reps').toLowerCase()}</Text>
                </View>
                <View style={s.rowExBadge}>
                  <Text style={s.rowExBadgeTxt}>{e.weight_kg > 0 ? `${e.weight_kg} ${t('workouts.add.kg')}` : t('workouts.add.no_weight')}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => { mediumHaptic(); setModal(true); }}>
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      <NewWorkoutSheet visible={modal} onClose={() => setModal(false)} onSave={d => { successHaptic(); return createWorkout(d).then(w => { load(); return w; }); }} day={day} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: G.bg },
  container: { padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -1, color: G.textPrimary },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: G.radiusSm, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: G.accent },
  statLbl: { fontSize: 10, color: G.textSecondary, marginTop: 4, textTransform: 'uppercase', fontWeight: '600' },
  card: { backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: G.radius, padding: 16, marginBottom: 16 },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weekLabel: { fontSize: 14, fontWeight: '700', color: G.textPrimary },
  weekBtn: { padding: 6, backgroundColor: G.bgChip, borderRadius: 8, borderWidth: 1, borderColor: G.bgCardBorder },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12 },
  weekDayActive: { backgroundColor: G.accent },
  wdName: { fontSize: 11, color: G.textSecondary, marginBottom: 4 },
  wdNum: { fontSize: 16, fontWeight: '600', color: G.textPrimary },
  wdActiveTxt: { color: '#fff' },
  wdDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: G.accent, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: G.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: G.textSecondary, textAlign: 'center' },
  woHeader: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: G.bgCardBorder, paddingBottom: 12, marginBottom: 12 },
  woTitle: { fontSize: 18, fontWeight: '700', color: G.textPrimary },
  woNotes: { fontSize: 13, color: G.textSecondary, marginTop: 4 },
  rowEx: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowExName: { fontSize: 15, fontWeight: '600', marginBottom: 2, color: G.textPrimary },
  rowExMeta: { fontSize: 12, color: G.textSecondary },
  rowExBadge: { backgroundColor: G.bgChipActive, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,122,255,0.3)' },
  rowExBadgeTxt: { fontSize: 13, fontWeight: '700', color: G.accent },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center', shadowColor: G.accent, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  // Modal styles
  modalSafe: { flex: 1, backgroundColor: G.bg },
  modalContent: { flex: 1 },
  modalHeader: { alignItems: 'center', paddingTop: 10, paddingBottom: 16 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: G.textPrimary },
  modalDate: { fontSize: 20, fontWeight: '700', color: G.textPrimary },
  closeBtn: { padding: 4 },
  input: { backgroundColor: G.bgInput, borderRadius: G.radiusXs, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, marginHorizontal: 16, borderWidth: 1, borderColor: G.bgCardBorder, color: G.textPrimary },
  chipScroll: { maxHeight: 40, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: G.bgChip, borderWidth: 1, borderColor: G.bgCardBorder, marginRight: 8 },
  chipActive: { backgroundColor: G.bgChipActive, borderColor: 'rgba(0,122,255,0.4)' },
  chipTxt: { fontSize: 14, color: G.textSecondary },
  chipTxtActive: { color: G.accent, fontWeight: '600' },
  libList: { flex: 1 },
  libItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: G.bgCardBorder, paddingHorizontal: 16 },
  libIcon: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  libInfo: { flex: 1 },
  libName: { fontSize: 16, fontWeight: '600', color: G.textPrimary },
  libMuscle: { fontSize: 12, color: G.textSecondary, marginTop: 2 },
  libCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: G.bgCardBorder, backgroundColor: G.bgChip, alignItems: 'center', justifyContent: 'center' },
  libCheckActive: { backgroundColor: G.accent, borderColor: G.accent },
  libFooter: { padding: 16, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: G.bg, borderTopWidth: 1, borderTopColor: G.bgCardBorder },
  btnPrimary: { backgroundColor: G.accent, padding: 16, borderRadius: G.radiusXs, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: 'rgba(0,122,255,0.5)', padding: 16, borderRadius: G.radiusXs, alignItems: 'center', backgroundColor: G.bgChipActive },
  btnOutlineTxt: { color: G.accent, fontSize: 16, fontWeight: '700' },
  formScroll: { flex: 1 },
  lbl: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: G.textSecondary, marginHorizontal: 16 },
  addExRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24 },
  emptyTxt: { textAlign: 'center', color: G.textSecondary, paddingVertical: 20 },
  exCard: { backgroundColor: G.bgCard, marginHorizontal: 16, borderRadius: G.radiusSm, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: G.bgCardBorder },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  exDelBtn: { padding: 8 },
  exGrid: { flexDirection: 'row', gap: 12 },
  exCol: { flex: 1 },
  exLbl: { fontSize: 11, fontWeight: '600', color: G.textSecondary, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  exInput: { backgroundColor: G.bgInput, borderRadius: 8, padding: 12, fontSize: 16, textAlign: 'center', color: G.textPrimary, borderWidth: 1, borderColor: G.bgCardBorder },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: G.bgCardBorder },
});
