import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { register, login, setToken } from '../api/index';

export default function AuthPage({ onAuth }) {
  const { t } = useTranslation();
  const [sub, setSub] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const upd = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: false }));
    setError('');
  };

  const submitEmail = async () => {
    setError('');
    const fe = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!form.email.trim()) fe.email = true;
    else if (!emailOk) { fe.email = true; setError(t('auth.errors.email_invalid')); setFieldErrors(fe); return; }
    if (!form.password) fe.password = true;
    if (sub === 'register' && !form.name.trim()) fe.name = true;
    if (sub === 'register' && form.password && form.password.length < 6) {
      fe.password = true; setError(t('auth.errors.pass_short')); setFieldErrors(fe); return;
    }
    if (Object.keys(fe).length) {
      setFieldErrors(fe); setError(t('auth.errors.all_fields')); return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const data = await (sub === 'register' ? register : login)(form);
      setToken(data.access_token);
      onAuth(data);
    } catch (e) { setError(e.response?.data?.detail || t('auth.errors.auth_error')); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Nut<Text style={{ color: '#007AFF' }}>rio</Text></Text>
          <Text style={styles.slogan}>{t('auth.slogan')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {[['login', t('auth.tabs.login')], ['register', t('auth.tabs.register')]].map(([m, l]) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, sub === m && styles.tabActive]}
                onPress={() => { setSub(m); setError(''); setFieldErrors({}); }}
              >
                <Text style={[styles.tabTxt, sub === m && styles.tabTxtActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {sub === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.fields.name')}</Text>
              <TextInput
                style={[styles.input, fieldErrors.name && styles.inputErr]}
                placeholder={t('auth.fields.name_ph')}
                value={form.name}
                onChangeText={v => upd('name', v)}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.fields.email')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputErr]}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={v => upd('email', v)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.fields.password')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.password && styles.inputErr]}
              placeholder={t('auth.fields.password_ph')}
              secureTextEntry
              value={form.password}
              onChangeText={v => upd('password', v)}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={submitEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{sub === 'register' ? t('auth.btn.create') : t('auth.btn.login')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  slogan: { fontSize: 15, color: '#8e8e93' },
  card: { padding: 24, borderRadius: 24, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e5e5ea', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  tabs: { flexDirection: 'row', backgroundColor: '#e5e5ea', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabTxt: { fontSize: 14, fontWeight: '600', color: '#8e8e93' },
  tabTxtActive: { color: '#000' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 16, fontSize: 16 },
  inputErr: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
  errorTxt: { color: '#ef4444', fontSize: 14 },
  btn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
