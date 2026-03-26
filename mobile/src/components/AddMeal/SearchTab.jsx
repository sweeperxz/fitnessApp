import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getRecentFoods, addRecentFood } from '../../api';
import { parseOFF } from '../../utils/openFoodFacts';

export default function SearchTab({ onSelect }) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [recent, setRecent] = useState([]);
    const [recentLoaded, setRecentLoaded] = useState(false);

    useEffect(() => {
        getRecentFoods()
            .then(d => { setRecent(d); setRecentLoaded(true); })
            .catch(() => { setRecent([]); setRecentLoaded(true); });
    }, []);

    const handleSelect = (item) => {
        addRecentFood(item).catch(() => {});
        onSelect(item);
    };

    useEffect(() => {
        const query = q.trim();
        if (query.length < 2) { setResults([]); setDone(false); return; }

        const timer = setTimeout(async () => {
            setLoading(true); setDone(true);
            try {
                const r = await fetch(
                    `https://world.openfoodfacts.org/cgi/search.pl?` +
                    `search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=30` +
                    `&fields=product_name,product_name_ru,product_name_ua,brands,nutriments`
                );
                const d = await r.json();
                const parsed = (d.products || []).map(parseOFF).filter(p => p.calories > 0).slice(0, 10);
                setResults(parsed);
            } catch { setResults([]); }
            setLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [q]);

    const isSearching = q.trim().length >= 2;
    const list = isSearching ? results : recent;

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder={t('meals.search_placeholder')}
                    value={q}
                    onChangeText={setQ}
                />
                <View style={styles.iconBox}>
                    {loading ? <ActivityIndicator color="#007AFF" /> : <Search color="#8e8e93" size={20} />}
                </View>
            </View>

            {!isSearching && recentLoaded && recent.length > 0 && (
                <Text style={styles.sectionTitle}>{t('meals.search_recent')}</Text>
            )}

            {isSearching && loading && !results.length && (
                <Text style={styles.emptyTxt}>{t('meals.search_searching')}</Text>
            )}
            {isSearching && !loading && done && !results.length && (
                <Text style={styles.emptyTxt}>{t('meals.search_not_found')}</Text>
            )}
            {!isSearching && recentLoaded && recent.length === 0 && (
                <Text style={styles.emptyTxt}>{t('meals.search_empty_recent')}</Text>
            )}

            <FlatList
                data={list}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)}>
                        <View style={styles.left}>
                            <Text style={styles.name}>{item.name}</Text>
                            {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
                            <Text style={styles.macros}>
                                B:{item.protein}g · F:{item.fat}g · C:{item.carbs}g
                            </Text>
                        </View>
                        <View style={styles.right}>
                            <Text style={styles.kcal}>{item.calories}</Text>
                            <Text style={styles.unit}>kcal/100g</Text>
                        </View>
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    input: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e5e5ea', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#8e8e93', textTransform: 'uppercase', marginBottom: 12 },
    emptyTxt: { textAlign: 'center', padding: 30, color: '#8e8e93', fontSize: 14 },
    row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f2f2f7', alignItems: 'center' },
    left: { flex: 1, paddingRight: 12 },
    name: { fontSize: 15, fontWeight: '600', color: '#000' },
    brand: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
    macros: { fontSize: 12, color: '#666', marginTop: 4 },
    right: { alignItems: 'flex-end' },
    kcal: { fontSize: 16, fontWeight: '800', color: '#007AFF' },
    unit: { fontSize: 10, color: '#8e8e93' }
});
