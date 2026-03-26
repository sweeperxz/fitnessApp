import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getAdminUsers, updateAdminUserRole, deleteAdminUser, getMe } from '../api/index';
import { tapHaptic, mediumHaptic, successHaptic, errorHaptic } from '../utils/haptic';
import { ShieldAlert, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';

export default function AdminPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [myId, setMyId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const loadData = async () => {
        try {
            const [me, allUsers] = await Promise.all([getMe(), getAdminUsers()]);
            setMyId(me.user_id);
            setUsers(allUsers);
            setError('');
        } catch (err) {
            if (err.response?.status === 403) {
                setError(t('admin.errors.forbidden'));
            } else {
                setError(t('admin.errors.load_fail'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggleRole = async (u) => {
        mediumHaptic();
        if (actionLoading) return;
        if (u.id === myId) {
            errorHaptic();
            Alert.alert(t('admin.errors.self_role'));
            return;
        }

        const newRole = u.role === 'admin' ? 'user' : 'admin';
        
        Alert.alert(
            'Confirm Role Change',
            t('admin.user_card.confirm_role', { email: u.email, role: newRole.toUpperCase() }),
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    style: 'default',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await updateAdminUserRole(u.id, newRole);
                            successHaptic();
                            await loadData();
                        } catch (err) {
                            errorHaptic();
                            Alert.alert('Error', err.response?.data?.detail || t('admin.errors.action_fail'));
                        }
                        setActionLoading(false);
                    }
                }
            ]
        );
    };

    const handleDelete = async (u) => {
        errorHaptic();
        if (actionLoading) return;
        if (u.id === myId) {
            Alert.alert(t('admin.errors.self_del'));
            return;
        }

        Alert.prompt(
            'Delete User',
            `${t('admin.user_card.confirm_del')}\n${u.email}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async (confirmText) => {
                        if (confirmText !== u.email) {
                            Alert.alert(t('admin.user_card.del_error_email'));
                            return;
                        }
                        setActionLoading(true);
                        try {
                            await deleteAdminUser(u.id);
                            successHaptic();
                            await loadData();
                        } catch (err) {
                            errorHaptic();
                            Alert.alert('Error', err.response?.data?.detail || t('admin.errors.action_fail'));
                        }
                        setActionLoading(false);
                    }
                }
            ]
        );
    };

    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('admin.title').split('-')[0]}<Text style={{ color: '#ff3b30' }}>-{t('admin.title').split('-')[1]}</Text></Text>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color="#007AFF" size="large" />
                    </View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <ShieldAlert color="#ff3b30" size={32} style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTxt}>{error}</Text>
                    </View>
                ) : (
                    <View>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statLbl}>{t('admin.stats.all')}</Text>
                                <Text style={styles.statVal}>{totalUsers}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statLbl}>{t('admin.stats.admins')}</Text>
                                <Text style={[styles.statVal, { color: '#007AFF' }]}>{totalAdmins}</Text>
                            </View>
                        </View>

                        <View style={styles.userList}>
                            {users.map(u => (
                                <View key={u.id} style={styles.userCard}>
                                    <View style={styles.userHeader}>
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={styles.userEmail}>{u.email}</Text>
                                            <Text style={styles.userName}>
                                                {u.name ? `${t('profile.user')}: ${u.name}` : t('admin.user_card.no_name')}
                                            </Text>
                                        </View>
                                        <View style={[styles.roleBadge, u.role === 'admin' && styles.roleBadgeAdmin]}>
                                            <Text style={[styles.roleTxt, u.role === 'admin' && styles.roleTxtAdmin]}>{u.role}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.userDate}>{t('admin.user_card.registered')}: {dayjs(u.created_at).format('DD.MM.YYYY HH:mm')}</Text>

                                    {u.id !== myId && (
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity 
                                                style={[styles.btnOutline, actionLoading && { opacity: 0.5 }]} 
                                                disabled={actionLoading}
                                                onPress={() => handleToggleRole(u)}
                                            >
                                                {u.role === 'admin' ? (
                                                    <><ArrowDownCircle color="#333" size={16} /><Text style={styles.btnOutlineTxt}>{t('admin.user_card.remove_admin')}</Text></>
                                                ) : (
                                                    <><ArrowUpCircle color="#333" size={16} /><Text style={styles.btnOutlineTxt}>{t('admin.user_card.make_admin')}</Text></>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.btnDel, actionLoading && { opacity: 0.5 }]} 
                                                disabled={actionLoading}
                                                onPress={() => handleDelete(u)}
                                            >
                                                <Trash2 color="#ff3b30" size={18} />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {u.id === myId && (
                                        <View style={styles.youBadge}>
                                            <Text style={styles.youTxt}>{t('admin.user_card.is_you')}</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f2f2f7' },
    container: { padding: 16 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -1, color: '#000' },
    loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    errorBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    errorTxt: { fontSize: 16, fontWeight: '700', color: '#ff3b30', textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderCurve: 'continuous', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    statLbl: { fontSize: 11, fontWeight: '800', color: '#8e8e93', textTransform: 'uppercase', marginBottom: 4 },
    statVal: { fontSize: 28, fontWeight: '800', color: '#000' },
    userList: { gap: 12 },
    userCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    userEmail: { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 4 },
    userName: { fontSize: 13, color: '#8e8e93' },
    roleBadge: { backgroundColor: '#f2f2f7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    roleBadgeAdmin: { backgroundColor: '#007AFF' },
    roleTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: '#8e8e93' },
    roleTxtAdmin: { color: '#fff' },
    userDate: { fontSize: 11, color: '#8e8e93', marginBottom: 16 },
    actionRow: { flexDirection: 'row', gap: 8 },
    btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f2f2f7', borderRadius: 10, paddingVertical: 10 },
    btnOutlineTxt: { fontSize: 13, fontWeight: '700', color: '#333' },
    btnDel: { width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe5e5', borderRadius: 10 },
    youBadge: { backgroundColor: '#e5f0ff', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    youTxt: { fontSize: 12, fontWeight: '700', color: '#007AFF' }
});
