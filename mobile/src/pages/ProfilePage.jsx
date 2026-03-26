import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getProfile, upsertProfile, getMe } from '../api/index';
import { tapHaptic, successHaptic, mediumHaptic } from '../utils/haptic';
import { LogOut } from 'lucide-react-native';
import { G } from '../utils/theme';

const GOALS = [{ v: 'lose', lKey: 'goals.lose' }, { v: 'maintain', lKey: 'goals.maintain' }, { v: 'gain', lKey: 'goals.gain' }];
const ACTS = [{ v: 'low', lKey: 'activity.low' }, { v: 'medium', lKey: 'activity.medium' }, { v: 'high', lKey: 'activity.high' }];

function calc(w, goal, act) {
  const p = Math.round(+w * 2), f = Math.round(+w * 1);
  let kcal = (+w * 10 + 6.25 * 175 - 5 * 30 + 5) * { low: 1.2, medium: 1.55, high: 1.725 }[act];
  if (goal === 'lose') kcal -= 400; if (goal === 'gain') kcal += 300;
  return { calories_goal: Math.round(kcal), protein_goal: p, fat_goal: f, carbs_goal: Math.max(Math.round((kcal - p * 4 - f * 9) / 4), 50), water_goal: Math.round(+w * 30) };
}

export default function ProfilePage({ onLogout }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ weight: '70', goal: 'maintain', activity: 'medium', water_goal: '2500', calories_goal: '2000', protein_goal: '150', fat_goal: '70', carbs_goal: '250' });
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('goals');
  const [saved, setSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => { });
    getProfile().then(p => {
      const strP = {};
      for (let key in p) strP[key] = String(p[key]);
      setForm(f => ({ ...f, ...strP }));
    }).catch(() => { });
  }, []);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: String(v) }));

  const save = async () => {
    await upsertProfile({
      ...form,
      weight: Number(form.weight),
      calories_goal: Number(form.calories_goal),
      protein_goal: Number(form.protein_goal),
      fat_goal: Number(form.fat_goal),
      carbs_goal: Number(form.carbs_goal),
      water_goal: Number(form.water_goal),
    });
    successHaptic();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t('profile.title')}</Text>
        </View>

        {user && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{user.name ? user.name[0].toUpperCase() : 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{user.name || t('profile.user')}</Text>
              <Text style={s.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        <View style={s.tabsContainer}>
          {[['goals', t('profile.tabs.goals')], ['settings', t('profile.tabs.settings')]].map(([tKey, l]) => (
            <TouchableOpacity key={tKey} style={[s.tab, tab === tKey && s.tabActive]} onPress={() => { tapHaptic(); setTab(tKey); }}>
              <Text style={[s.tabTxt, tab === tKey && s.tabTxtActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'goals' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.main_data')}</Text>

              <Text style={s.lbl}>{t('profile.weight')}</Text>
              <View style={s.inputBox}><Text style={s.inputText}>{form.weight}</Text></View>

              <Text style={s.lbl}>{t('profile.goal')}</Text>
              <View style={s.chipRow}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g.v} style={[s.chip, form.goal === g.v && s.chipActive]} onPress={() => { tapHaptic(); upd('goal', g.v); }}>
                    <Text style={[s.chipTxt, form.goal === g.v && s.chipTxtActive]}>{t(g.lKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.lbl}>{t('profile.activity')}</Text>
              <View style={s.chipRow}>
                {ACTS.map(a => (
                  <TouchableOpacity key={a.v} style={[s.chip, form.activity === a.v && s.chipActive]} onPress={() => { tapHaptic(); upd('activity', a.v); }}>
                    <Text style={[s.chipTxt, form.activity === a.v && s.chipTxtActive]}>{t(a.lKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={s.btnOutline} onPress={() => {
                successHaptic();
                const res = calc(form.weight, form.goal, form.activity);
                Object.keys(res).forEach(k => upd(k, res[k]));
              }}>
                <Text style={s.btnOutlineTxt}>{t('profile.recalculate')}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.macros_goals')}</Text>
              <View style={s.row}>
                <View style={s.col}><Text style={s.lbl}>{t('today.calories')}</Text><View style={s.inputBox}><Text style={s.inputText}>{form.calories_goal}</Text></View></View>
                <View style={s.col}><Text style={s.lbl}>{t('today.protein')}</Text><View style={s.inputBox}><Text style={s.inputText}>{form.protein_goal}</Text></View></View>
              </View>
              <View style={s.row}>
                <View style={s.col}><Text style={s.lbl}>{t('today.fat')}</Text><View style={s.inputBox}><Text style={s.inputText}>{form.fat_goal}</Text></View></View>
                <View style={s.col}><Text style={s.lbl}>{t('today.carbs')}</Text><View style={s.inputBox}><Text style={s.inputText}>{form.carbs_goal}</Text></View></View>
              </View>
              <Text style={s.lbl}>{t('today.water')} (мл)</Text>
              <View style={s.inputBox}><Text style={s.inputText}>{form.water_goal}</Text></View>
            </View>

            <TouchableOpacity style={s.btnPrimary} onPress={save}>
              <Text style={s.btnTxt}>{saved ? t('common.saved') : t('common.save')}</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'settings' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.appearance')}</Text>
              <View style={s.settingRow}>
                <Text style={s.settingLbl}>{t('profile.language')}</Text>
                <Text style={s.settingVal}>Русский</Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.notifications')}</Text>
              <View style={s.settingRow}>
                <Text style={s.settingLbl}>{t('profile.push')}</Text>
                <Switch
                  value={isSubscribed}
                  onValueChange={v => { tapHaptic(); setIsSubscribed(v); }}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: `${G.accent}99` }}
                  thumbColor={isSubscribed ? G.accent : 'rgba(255,255,255,0.6)'}
                />
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.account')}</Text>
              <View style={s.settingRow}>
                <Text style={s.settingLbl}>Email</Text>
                <Text style={s.settingVal}>{user?.email}</Text>
              </View>
              <TouchableOpacity style={s.settingRow} onPress={() => { mediumHaptic(); onLogout(); }}>
                <Text style={[s.settingLbl, { color: G.accentRed }]}>{t('common.logout')}</Text>
                <LogOut color={G.accentRed} size={20} />
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>{t('profile.about')}</Text>
              <View style={s.settingRow}>
                <Text style={s.settingLbl}>{t('profile.version')}</Text>
                <Text style={s.settingVal}>3.0 Liquid Glass</Text>
              </View>
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: G.bg },
  container: { padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -1, color: G.textPrimary },
  card: { backgroundColor: G.bgCard, borderWidth: 1, borderColor: G.bgCardBorder, borderRadius: G.radius, padding: 16, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '800', marginBottom: 4, color: G.textPrimary },
  userEmail: { fontSize: 13, color: G.textSecondary },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: G.radiusSm, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: G.bgCardBorder },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(0,122,255,0.22)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.4)' },
  tabTxt: { fontSize: 14, fontWeight: '600', color: G.textSecondary },
  tabTxtActive: { color: G.accent },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, color: G.textPrimary },
  lbl: { fontSize: 13, fontWeight: '600', color: G.textSecondary, marginBottom: 8 },
  inputBox: { backgroundColor: G.bgInput, padding: 14, borderRadius: G.radiusXs, marginBottom: 16, borderWidth: 1, borderColor: G.bgCardBorder },
  inputText: { fontSize: 16, color: G.textPrimary },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: G.radiusXs, backgroundColor: G.bgChip, alignItems: 'center', borderWidth: 1, borderColor: G.bgCardBorder },
  chipActive: { backgroundColor: G.bgChipActive, borderColor: 'rgba(0,122,255,0.5)' },
  chipTxt: { fontSize: 13, fontWeight: '600', color: G.textSecondary },
  chipTxtActive: { color: G.accent },
  btnOutline: { borderWidth: 1, borderColor: 'rgba(0,122,255,0.5)', borderRadius: G.radiusXs, padding: 14, alignItems: 'center', backgroundColor: G.bgChipActive },
  btnOutlineTxt: { color: G.accent, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  btnPrimary: { backgroundColor: G.accent, borderRadius: G.radiusXs, padding: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: G.bgCardBorder },
  settingLbl: { fontSize: 15, fontWeight: '500', color: G.textPrimary },
  settingVal: { fontSize: 15, color: G.textSecondary },
});
