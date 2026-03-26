import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Camera } from 'lucide-react-native';
import BarcodeScanner from '../BarcodeScanner';
import { parseOFF } from '../../utils/openFoodFacts';
import { addRecentFood } from '../../api';

export default function BarcodeTab({ onSelect }) {
    const [scanning, setScanning] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [found, setFound] = useState(null);

    const lookup = async (rawCode = null) => {
        const bc = (rawCode || code).replace(/\D/g, '').trim();
        if (!bc) return;
        setLoading(true); setError(''); setFound(null);
        try {
            const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`);
            const d = await r.json();
            if (d.status === 1 && d.product) {
                const item = parseOFF(d.product);
                if (item.calories > 0) {
                    setFound(item);
                } else {
                    setError('Продукт найден, но данные КБЖУ отсутствуют.');
                }
            } else {
                setError(`Штрихкод ${bc} не найден.\nПопробуй добавить вручную.`);
            }
        } catch {
            setError('Ошибка соединения. Проверь интернет.');
        }
        setLoading(false);
    };

    const handleSelect = (item) => {
        addRecentFood(item).catch(() => {});
        onSelect(item);
    };

    return (
        <View style={styles.container}>
            <Modal visible={scanning} animationType="slide">
                <BarcodeScanner onResult={(data) => { setScanning(false); lookup(data); }} onClose={() => setScanning(false)} />
            </Modal>

            <TouchableOpacity style={styles.camBtn} onPress={() => { setScanning(true); setError(''); setFound(null); }}>
                <View style={styles.camIconBox}>
                    <Camera color="#fff" size={24} />
                </View>
                <Text style={styles.camTitle}>Открыть камеру</Text>
                <Text style={styles.camSub}>Наведи на штрихкод</Text>
            </TouchableOpacity>

            <View style={styles.dividerBox}>
                <View style={styles.line} />
                <Text style={styles.dividerTxt}>или введи код вручную</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="4607046820011"
                    keyboardType="numeric"
                    value={code}
                    onChangeText={setCode}
                    onSubmitEditing={() => lookup()}
                />
                <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={() => lookup()} disabled={loading || !code.trim()}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Найти</Text>}
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorTxt}>{error}</Text>
                </View>
            ) : null}

            {found && (
                <View style={styles.resultBox}>
                    <Text style={styles.resName}>{found.name}</Text>
                    {found.brand ? <Text style={styles.resBrand}>{found.brand}</Text> : null}
                    
                    <View style={styles.resGrid}>
                        {[
                            { l: 'Ккал', v: found.calories, c: '#007AFF' },
                            { l: 'Белки', v: found.protein + 'г', c: '#AF52DE' },
                            { l: 'Жиры', v: found.fat + 'г', c: '#FF9500' },
                            { l: 'Углев', v: found.carbs + 'г', c: '#34C759' },
                        ].map(s => (
                            <View key={s.l} style={styles.resItem}>
                                <Text style={[styles.resVal, { color: s.c }]}>{s.v}</Text>
                                <Text style={styles.resLbl}>{s.l}</Text>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.btn} onPress={() => handleSelect(found)}>
                        <Text style={styles.btnTxt}>Добавить этот продукт</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    camBtn: { padding: 24, backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: '#e5e5ea', borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', marginBottom: 16 },
    camIconBox: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    camTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    camSub: { fontSize: 13, color: '#8e8e93' },
    dividerBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    line: { flex: 1, height: 1, backgroundColor: '#e5e5ea' },
    dividerTxt: { marginHorizontal: 8, fontSize: 12, color: '#8e8e93' },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    input: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 12, padding: 16, fontSize: 16 },
    btn: { backgroundColor: '#007AFF', paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.6 },
    errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
    errorTxt: { color: '#ef4444', fontSize: 14 },
    resultBox: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5ea' },
    resName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    resBrand: { fontSize: 13, color: '#8e8e93', marginBottom: 12 },
    resGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    resItem: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f2f2f7' },
    resVal: { fontSize: 16, fontWeight: '800' },
    resLbl: { fontSize: 10, color: '#8e8e93', marginTop: 4, textTransform: 'uppercase' }
});
