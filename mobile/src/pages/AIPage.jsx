import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getProfile, sendChatMessage } from '../api/index';
import Markdown from 'react-native-markdown-display';
import { tapHaptic, successHaptic } from '../utils/haptic';
import { Send, Trash2 } from 'lucide-react-native';
import { G } from '../utils/theme';

const SUGGESTIONS = [
    'Сколько калорий мне нужно для похудения?',
    'Какой лучший протеин после тренировки?',
    'Составь план питания на день',
];

export default function AIPage() {
    const { t } = useTranslation();
    const [msgs, setMsgs] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const send = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        tapHaptic();
        setInput('');
        const next = [...msgs, { role: 'user', content: msg }];
        setMsgs(next);
        setLoading(true);
        try {
            const data = await sendChatMessage({ messages: next });
            const parts = data.candidates?.[0]?.content?.parts;
            const reply = parts ? parts.map(p => p.text).join('') : 'Не удалось получить ответ.';
            successHaptic();
            setMsgs(m => [...m, { role: 'assistant', content: reply }]);
        } catch {
            setMsgs(m => [...m, { role: 'assistant', content: 'Ошибка соединения. Попробуйте снова.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={s.header}>
                    <Text style={s.title}>{t('ai.title')}</Text>
                    {msgs.length > 0 && (
                        <TouchableOpacity style={s.clearBtn} onPress={() => setMsgs([])}>
                            <Trash2 color={G.textSecondary} size={18} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={s.chatArea}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {msgs.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <View style={s.aiIconLg}>
                                <Text style={{ fontSize: 32 }}>✨</Text>
                            </View>
                            <Text style={s.welcomeTitle}>Nutrio AI</Text>
                            <Text style={s.welcomeSub}>{t('ai.empty')}</Text>

                            <View style={s.suggestBox}>
                                {SUGGESTIONS.map((hint, i) => (
                                    <TouchableOpacity key={i} style={s.suggestBtn} onPress={() => send(hint)}>
                                        <Text style={s.suggestTxt}>{hint}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        msgs.map((m, i) => (
                            <View key={i} style={[s.bubbleWrap, m.role === 'user' ? s.bubbleWrapUser : s.bubbleWrapAI]}>
                                {m.role === 'assistant' && (
                                    <View style={s.aiIconSm}>
                                        <Text style={{ fontSize: 14 }}>✨</Text>
                                    </View>
                                )}
                                <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                                    {m.role === 'assistant' ? (
                                        <Markdown style={mdStyles}>{m.content}</Markdown>
                                    ) : (
                                        <Text style={s.bubbleUserTxt}>{m.content}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                    {loading && (
                        <View style={[s.bubbleWrap, s.bubbleWrapAI]}>
                            <View style={s.aiIconSm}>
                                <Text style={{ fontSize: 14 }}>✨</Text>
                            </View>
                            <View style={[s.bubble, s.bubbleAI]}>
                                <ActivityIndicator color={G.accent} />
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={s.inputBox}>
                    <TextInput
                        style={s.input}
                        placeholder={t('ai.placeholder')}
                        placeholderTextColor={G.textTertiary}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxHeight={100}
                    />
                    <TouchableOpacity
                        style={[s.sendBtn, !input.trim() && { opacity: 0.4 }]}
                        onPress={() => send()}
                        disabled={!input.trim() || loading}
                    >
                        <Send color="#fff" size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: G.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: G.bgCardBorder },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -1, color: G.textPrimary },
    clearBtn: { padding: 8, backgroundColor: G.bgCard, borderRadius: 10, borderWidth: 1, borderColor: G.bgCardBorder },
    chatArea: { flex: 1 },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    aiIconLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: G.bgChipActive, borderWidth: 1, borderColor: 'rgba(0,122,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    welcomeTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: G.textPrimary },
    welcomeSub: { fontSize: 14, color: G.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 20 },
    suggestBox: { width: '100%', gap: 10 },
    suggestBtn: { backgroundColor: G.bgCard, borderRadius: G.radiusSm, padding: 16, borderWidth: 1, borderColor: G.bgCardBorder },
    suggestTxt: { fontSize: 14, color: G.textPrimary, lineHeight: 20 },
    bubbleWrap: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
    bubbleWrapUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    bubbleWrapAI: { alignSelf: 'flex-start', alignItems: 'flex-end' },
    aiIconSm: { width: 28, height: 28, borderRadius: 14, backgroundColor: G.bgChipActive, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
    bubble: { padding: 14, borderRadius: 18 },
    bubbleUser: { backgroundColor: G.accent, borderBottomRightRadius: 4 },
    bubbleUserTxt: { color: '#fff', fontSize: 16, lineHeight: 22 },
    bubbleAI: { backgroundColor: G.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: G.bgCardBorder },
    inputBox: { flexDirection: 'row', padding: 16, backgroundColor: G.bg, borderTopWidth: 1, borderTopColor: G.bgCardBorder, alignItems: 'flex-end', gap: 12 },
    input: { flex: 1, backgroundColor: G.bgInput, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, minHeight: 44, borderWidth: 1, borderColor: G.bgCardBorder, color: G.textPrimary },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center', shadowColor: G.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});

const mdStyles = StyleSheet.create({
    body: { fontSize: 15, color: G.textPrimary, lineHeight: 22 },
    paragraph: { marginBottom: 8 },
    strong: { fontWeight: '700', color: '#fff' },
});
