import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MEAL_TYPES } from '../../utils/constants';
import { addRecentFood } from '../../api';
import RNPickerSelect from 'react-native-picker-select';

export default function ManualTab({ initial, onAdd, onClose }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        meal_type: t('meals.Breakfast'),
        name: '', calories: '', protein: '', fat: '', carbs: '', weight: '100',
        ...(initial || {}),
    });

    const [isPer100Mode, setIsPer100Mode] = useState(initial ? (Number(initial.calories) > 0) : true);

    const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const w = Number(form.weight) || 100;

    const submit = () => {
        if (!form.name || !form.calories) return;
        const ratio = isPer100Mode ? w / 100 : 1;

        const mealItem = {
            name: form.name,
            calories: Math.round(+form.calories * ratio),
            protein: Math.round(+form.protein * ratio),
            fat: Math.round(+form.fat * ratio),
            carbs: Math.round(+form.carbs * ratio),
        };

        const recentItem = {
            name: form.name,
            calories: +form.calories,
            protein: +form.protein || 0,
            fat: +form.fat || 0,
            carbs: +form.carbs || 0,
        };
        addRecentFood(recentItem).catch(() => {});
        onAdd({ meal_type: form.meal_type, ...mealItem });
        onClose();
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                <Text style={styles.lbl}>{t('today.meals')}</Text>
                <View style={styles.pickerBox}>
                    <RNPickerSelect
                        value={form.meal_type}
                        onValueChange={(val) => upd('meal_type', val)}
                        items={MEAL_TYPES.map(k => ({ label: t(`meals.${k}`), value: k }))}
                    />
                </View>

                <Text style={styles.lbl}>{t('meals.manual_name')}</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={v => upd('name', v)} />

                <View style={styles.switchBox}>
                    <TouchableOpacity style={[styles.switchBtn, isPer100Mode && styles.switchActive]} onPress={() => setIsPer100Mode(true)}>
                        <Text style={[styles.switchTxt, isPer100Mode && styles.switchTxtActive]}>{t('meals.manual_per_100')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.switchBtn, !isPer100Mode && styles.switchActive]} onPress={() => setIsPer100Mode(false)}>
                        <Text style={[styles.switchTxt, !isPer100Mode && styles.switchTxtActive]}>{t('meals.manual_per_portion')}</Text>
                    </TouchableOpacity>
                </View>

                {isPer100Mode && (
                    <View style={styles.weightBox}>
                        <Text style={styles.lbl}>{t('meals.manual_weight_label')}</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={form.weight} onChangeText={v => upd('weight', v)} />
                        
                        <View style={styles.totalBox}>
                            <Text style={styles.totalTxt}>
                                {t('meals.manual_total')} <Text style={{ color: '#007AFF', fontWeight: '800' }}>{Math.round(+form.calories * w / 100)} kcal</Text>
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.lbl}>{isPer100Mode ? 'Ккал в 100г' : 'Ккал в порции'} *</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.calories} onChangeText={v => upd('calories', v)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.lbl}>Белки (г)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.protein} onChangeText={v => upd('protein', v)} />
                    </View>
                </View>
                
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.lbl}>Жиры (г)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.fat} onChangeText={v => upd('fat', v)} />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.lbl}>Углеводы (г)</Text>
                        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.carbs} onChangeText={v => upd('carbs', v)} />
                    </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, (!form.name || !form.calories) && styles.disabled]} onPress={submit} disabled={!form.name || !form.calories}>
                    <Text style={styles.submitTxt}>Добавить</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    lbl: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
    pickerBox: { backgroundColor: '#f2f2f7', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16 },
    input: { backgroundColor: '#f2f2f7', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
    switchBox: { flexDirection: 'row', backgroundColor: '#e5e5ea', borderRadius: 8, padding: 4, marginBottom: 16 },
    switchBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    switchActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    switchTxt: { fontSize: 13, fontWeight: '600', color: '#8e8e93' },
    switchTxtActive: { color: '#000' },
    weightBox: { marginBottom: 8 },
    totalBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 16 },
    totalTxt: { fontSize: 12, color: '#666' },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    submitBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    disabled: { opacity: 0.5 },
    submitTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
