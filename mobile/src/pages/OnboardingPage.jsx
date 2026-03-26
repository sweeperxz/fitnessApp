import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { 
  User, 
  ArrowDown, 
  Minus, 
  ArrowUp, 
  Footprints, 
  Activity, 
  Flame 
} from 'lucide-react-native';

import { upsertProfile } from '../api/index';

const STEPS = 5;

function calcGoals({ age, weight, height, gender, activity, goal }) {
  const w = +weight, h = +height, a = +age;
  const bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const mult = { low: 1.2, medium: 1.55, high: 1.725 }[activity] || 1.55;
  let kcal = bmr * mult;
  if (goal === 'lose') kcal -= 400;
  if (goal === 'gain') kcal += 300;
  const protein = Math.round(w * 2), fat = Math.round(w * 1);
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 50);
  return { 
    calories_goal: Math.round(kcal), 
    protein_goal: protein, 
    fat_goal: fat, 
    carbs_goal: carbs, 
    water_goal: Math.round(w * 30) 
  };
}

export default function OnboardingPage({ onDone }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ gender: '', age: '', weight: '', height: '', goal: '', activity: '' });
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => {
    Haptics.selectionAsync();
    setData(d => ({ ...d, [k]: v }));
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s + 1);
  };

  const back = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s - 1);
  };

  const finish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try { 
      await upsertProfile({ weight: +data.weight, goal: data.goal, activity: data.activity, ...calcGoals(data) }); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone(); 
    } catch (e) { 
      console.error(e); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setLoading(false);
  };

  const GENDER_OPTS = [
    { v: 'male', label: t('onboarding.steps.gender.male'), Icon: User },
    { v: 'female', label: t('onboarding.steps.gender.female'), Icon: User },
  ];
  const GOAL_OPTS = [
    { v: 'lose', label: t('onboarding.steps.goal.lose'), desc: t('onboarding.steps.goal.lose_desc'), Icon: ArrowDown },
    { v: 'maintain', label: t('onboarding.steps.goal.maintain'), desc: t('onboarding.steps.goal.maintain_desc'), Icon: Minus },
    { v: 'gain', label: t('onboarding.steps.goal.gain'), desc: t('onboarding.steps.goal.gain_desc'), Icon: ArrowUp },
  ];
  const ACTIVITY_OPTS = [
    { v: 'low', label: t('onboarding.steps.activity.low'), desc: t('onboarding.steps.activity.low_desc'), Icon: Footprints },
    { v: 'medium', label: t('onboarding.steps.activity.medium'), desc: t('onboarding.steps.activity.medium_desc'), Icon: Activity },
    { v: 'high', label: t('onboarding.steps.activity.high'), desc: t('onboarding.steps.activity.high_desc'), Icon: Flame },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Nutrio</Text>
          <Text style={styles.slogan}>{t('onboarding.slogan')}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        {/* --- STEP 1: GENDER --- */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepCount}>{t('onboarding.prog_step', { curr: 1, total: 5 })}</Text>
            <Text style={styles.title}>{t('onboarding.steps.gender.title')}</Text>
            <Text style={styles.desc}>{t('onboarding.steps.gender.desc')}</Text>
            
            <View style={styles.gridContainer}>
              {GENDER_OPTS.map(g => {
                const isActive = data.gender === g.v;
                return (
                  <TouchableOpacity
                    key={g.v}
                    style={[styles.gridCard, isActive && styles.cardActive]}
                    onPress={() => upd('gender', g.v)}
                    activeOpacity={0.7}
                  >
                    <g.Icon color={isActive ? '#007AFF' : '#ADADAD'} size={32} style={styles.cardIconCenter} />
                    <Text style={[styles.cardTitleCenter, isActive && styles.textActive]}>{g.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.btnPrimary, !data.gender && styles.btnDisabled]} onPress={next} disabled={!data.gender}>
                <Text style={styles.btnPrimaryText}>{t('onboarding.footer.next')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- STEP 2: PARAMS --- */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepCount}>{t('onboarding.prog_step', { curr: 2, total: 5 })}</Text>
            <Text style={styles.title}>{t('onboarding.steps.params.title')}</Text>
            <Text style={styles.desc}>{t('onboarding.steps.params.desc')}</Text>
            
            {[
              { k: 'age', l: t('onboarding.steps.params.age'), ph: '25', t: 'numeric' },
              { k: 'height', l: t('onboarding.steps.params.height'), ph: '175', t: 'numeric' },
              { k: 'weight', l: t('onboarding.steps.params.weight'), ph: '75', t: 'decimal-pad' }
            ].map(f => (
              <View style={styles.formGroup} key={f.k}>
                <Text style={styles.inputLabel}>{f.l}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType={f.t}
                  placeholder={f.ph}
                  placeholderTextColor="#ADADAD"
                  value={data[f.k]}
                  onChangeText={v => upd(f.k, v)}
                />
              </View>
            ))}
            
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.btnOutline} onPress={back}>
                <Text style={styles.btnOutlineText}>{t('onboarding.footer.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnPrimaryRow, (!data.age || !data.height || !data.weight) && styles.btnDisabled]} 
                onPress={next} 
                disabled={!data.age || !data.height || !data.weight}
              >
                <Text style={styles.btnPrimaryText}>{t('onboarding.footer.next')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- STEP 3: GOAL --- */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepCount}>{t('onboarding.prog_step', { curr: 3, total: 5 })}</Text>
            <Text style={styles.title}>{t('onboarding.steps.goal.title')}</Text>
            <Text style={styles.desc}>{t('onboarding.steps.goal.desc')}</Text>
            
            {GOAL_OPTS.map(g => {
              const isActive = data.goal === g.v;
              return (
                <TouchableOpacity
                  key={g.v}
                  style={[styles.cardRow, isActive && styles.cardActive]}
                  onPress={() => upd('goal', g.v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardIconRow, isActive && styles.cardIconRowActive]}>
                    <g.Icon color={isActive ? '#007AFF' : '#666'} size={24} />
                  </View>
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, isActive && styles.textActive]}>{g.label}</Text>
                    <Text style={styles.cardDesc}>{g.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.btnOutline} onPress={back}>
                <Text style={styles.btnOutlineText}>{t('onboarding.footer.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimaryRow, !data.goal && styles.btnDisabled]} onPress={next} disabled={!data.goal}>
                <Text style={styles.btnPrimaryText}>{t('onboarding.footer.next')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- STEP 4: ACTIVITY --- */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepCount}>{t('onboarding.prog_step', { curr: 4, total: 5 })}</Text>
            <Text style={styles.title}>{t('onboarding.steps.activity.title')}</Text>
            <Text style={styles.desc}>{t('onboarding.steps.activity.desc')}</Text>
            
            {ACTIVITY_OPTS.map(a => {
              const isActive = data.activity === a.v;
              return (
                <TouchableOpacity
                  key={a.v}
                  style={[styles.cardRow, isActive && styles.cardActive]}
                  onPress={() => upd('activity', a.v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardIconRow, isActive && styles.cardIconRowActive]}>
                    <a.Icon color={isActive ? '#007AFF' : '#666'} size={24} />
                  </View>
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, isActive && styles.textActive]}>{a.label}</Text>
                    <Text style={styles.cardDesc}>{a.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.btnOutline} onPress={back}>
                <Text style={styles.btnOutlineText}>{t('onboarding.footer.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimaryRow, !data.activity && styles.btnDisabled]} onPress={next} disabled={!data.activity}>
                <Text style={styles.btnPrimaryText}>{t('onboarding.footer.next')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- STEP 5: FINISH --- */}
        {step === 4 && (() => {
          const goals = data.weight && data.age && data.height ? calcGoals(data) : null;
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepCount}>{t('onboarding.prog_step', { curr: 5, total: 5 })}</Text>
              <Text style={styles.title}>{t('onboarding.steps.finish.title')}</Text>
              <Text style={styles.desc}>{t('onboarding.steps.finish.desc')}</Text>
              
              {goals && (
                <View style={styles.summaryCard}>
                  {[
                    { l: t('today.calories'), v: goals.calories_goal + ' ' + t('onboarding.steps.finish.cal_unit'), c: '#007AFF' },
                    { l: t('today.protein'), v: goals.protein_goal + (t('today.ml')?.[0]?.toLowerCase() === 'м' ? 'г' : 'g'), c: '#AF52DE' },
                    { l: t('today.fat'), v: goals.fat_goal + (t('today.ml')?.[0]?.toLowerCase() === 'м' ? 'г' : 'g'), c: '#FF9500' },
                    { l: t('today.carbs'), v: goals.carbs_goal + (t('today.ml')?.[0]?.toLowerCase() === 'м' ? 'г' : 'g'), c: '#34C759' },
                    { l: t('today.water'), v: goals.water_goal + ' ' + t('today.ml'), c: '#333333' }
                  ].map((r, i, arr) => (
                    <View key={r.l} style={[styles.summaryRow, i === arr.length - 1 && styles.summaryRowLast]}>
                      <Text style={styles.summaryLabel}>{r.l}</Text>
                      <Text style={[styles.summaryValue, { color: r.c }]}>{r.v}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.btnOutline} onPress={back}>
                  <Text style={styles.btnOutlineText}>{t('onboarding.footer.back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimaryRow, loading && styles.btnDisabled]} onPress={finish} disabled={loading}>
                  <Text style={styles.btnPrimaryText}>{loading ? t('onboarding.steps.finish.save') : t('onboarding.steps.finish.start')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  slogan: {
    color: '#8E8E93',
    fontSize: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  dotActive: {
    backgroundColor: '#007AFF',
  },
  stepContainer: {
    flex: 1,
  },
  stepCount: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  cardIconCenter: {
    marginBottom: 12,
  },
  cardTitleCenter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  textActive: {
    color: '#007AFF',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  cardIconRow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconRowActive: {
    backgroundColor: '#D1E8FF',
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24,
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryRow: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
});
