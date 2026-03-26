import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import SearchTab from './SearchTab';
import BarcodeTab from './BarcodeTab';
import ManualTab from './ManualTab';
import AiTab from './AiTab';

const TAB_KEYS = ['meals.tabs.search', 'meals.tabs.barcode', 'meals.tabs.manual', 'meals.tabs.ai'];

export default function AddModal({ visible, onClose, onAdd }) {
    const { t } = useTranslation();
    const [tab, setTab] = useState(0);
    const [selected, setSelected] = useState(null);

    const pick = (item) => {
        setSelected(item);
        setTab(2);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <Text style={styles.title}>{t('meals.add_title')}</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                            {TAB_KEYS.map((tk, i) => {
                                const isActive = tab === i;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.tabBtn, isActive && styles.tabActive]}
                                        onPress={() => { setTab(i); setSelected(null); }}
                                    >
                                        <Text style={[styles.tabTxt, isActive && styles.tabTxtActive]}>{t(tk)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={styles.content}>
                        {tab === 0 && <SearchTab onSelect={pick} />}
                        {tab === 1 && <BarcodeTab onSelect={pick} />}
                        {tab === 2 && (
                            <ManualTab
                                initial={selected ? {
                                    name: selected.name + (selected.brand ? ` (${selected.brand})` : ''),
                                    calories: String(selected.calories),
                                    protein: String(selected.protein),
                                    fat: String(selected.fat),
                                    carbs: String(selected.carbs),
                                } : null}
                                onAdd={onAdd}
                                onClose={onClose}
                            />
                        )}
                        {tab === 3 && <AiTab onSelect={pick} />}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    header: { alignItems: 'center', paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f7' },
    handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#d1d1d6', marginBottom: 12 },
    title: { fontSize: 20, fontWeight: '700' },
    closeBtn: { position: 'absolute', right: 16, top: 16, padding: 4 },
    closeTxt: { fontSize: 22, color: '#8e8e93' },
    tabsContainer: { borderBottomWidth: 1, borderBottomColor: '#f2f2f7' },
    tabsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f2f2f7' },
    tabActive: { backgroundColor: '#007AFF' },
    tabTxt: { fontSize: 15, fontWeight: '600', color: '#8e8e93' },
    tabTxtActive: { color: '#fff' },
    content: { flex: 1, padding: 16 }
});
