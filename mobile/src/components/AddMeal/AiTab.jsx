import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sendChatMessage, addRecentFood } from '../../api';

export default function AiTab({ onSelect }) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const calculate = async () => {
        const q = text.trim();
        if (!q) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const prompt = `Ты нутрициолог. Пользователь описал свой приём пищи. Верни ТОЛЬКО JSON-объект (без markdown, без пояснений) со следующими полями:
{ "name": "краткое название блюда", "calories": число, "protein": число, "fat": число, "carbs": число }
Описание приёма пищи: ${q}`;

            const res = await sendChatMessage({ messages: [{ role: 'user', content: prompt }] });
            const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Не удалось распознать ответ AI');
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.calories) throw new Error('AI не вернул калории');
            setResult(parsed);
        } catch (e) {
            setError(e.message || 'Ошибка распознавания текста');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.dividerBox}>
                    <View style={styles.line} />
                    <Text style={styles.dividerTxt}>{t('meals.ai_description')}</Text>
                    <View style={styles.line} />
                </View>

                <TextInput
                    style={styles.input}
                    placeholder={t('meals.ai_guess_placeholder')}
                    value={text}
                    onChangeText={setText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={[styles.btn, (!text.trim() || loading) && styles.btnDisabled]} onPress={calculate} disabled={loading || !text.trim()}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{t('meals.ai_guess_button')}</Text>}
                </TouchableOpacity>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorTxt}>{error}</Text>
                    </View>
                ) : null}

                {result && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resName}>{result.name}</Text>
                        <View style={styles.resGrid}>
                            {[
                                { l: t('today.calories').slice(0, 4), v: result.calories, c: '#007AFF' },
                                { l: t('today.protein'), v: result.protein + 'g', c: '#AF52DE' },
                                { l: t('today.fat'), v: result.fat + 'g', c: '#FF9500' },
                                { l: t('today.carbs').slice(0, 5), v: result.carbs + 'g', c: '#34C759' },
                            ].map(s => (
                                <View key={s.l} style={styles.resItem}>
                                    <Text style={[styles.resVal, { color: s.c }]}>{s.v}</Text>
                                    <Text style={styles.resLbl}>{s.l}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.btn} onPress={() => {
                            addRecentFood(result).catch(() => {});
                            onSelect(result);
                        }}>
                            <Text style={styles.btnTxt}>{t('meals.ai_use_data')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    dividerBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    line: { flex: 1, height: 1, backgroundColor: '#e5e5ea' },
    dividerTxt: { marginHorizontal: 8, fontSize: 12, color: '#8e8e93' },
    input: { backgroundColor: '#f2f2f7', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 100, marginBottom: 16 },
    btn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
    errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
    errorTxt: { color: '#ef4444', fontSize: 14 },
    resultBox: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5ea' },
    resName: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    resGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    resItem: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f2f2f7' },
    resVal: { fontSize: 16, fontWeight: '800' },
    resLbl: { fontSize: 10, color: '#8e8e93', marginTop: 4, textTransform: 'uppercase' }
});
