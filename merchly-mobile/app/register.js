import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth';
import { colors, radius } from '../src/theme';
import { GradientButton } from '../src/ui';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState('seller');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
      router.back();
    } catch (e) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.screen}>
      <Text style={s.title}>Create your account</Text>
      <Text style={s.sub}>Join Merchly and start selling — or shopping — in seconds.</Text>

      <View style={s.tabs}>
        <RoleTab active={role === 'seller'} onPress={() => setRole('seller')} title="I'm selling" sub="List merch & get paid" />
        <RoleTab active={role === 'shopper'} onPress={() => setRole('shopper')} title="I'm shopping" sub="Buy creator merch" />
      </View>

      <Text style={s.label}>{role === 'seller' ? 'Store / display name' : 'Your name'}</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder={role === 'seller' ? 'e.g. Nova Prints' : 'e.g. Alex Rivera'} placeholderTextColor={colors.faint} />
      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.faint} />
      <Text style={s.label}>Password</Text>
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.faint} />

      <GradientButton title={role === 'seller' ? 'Create my store' : 'Create account'} onPress={submit} loading={loading} style={{ marginTop: 20 }} />
      <Text style={s.foot} onPress={() => router.replace('/login')}>Already have an account? <Text style={{ color: colors.fuchsia }}>Log in</Text></Text>
    </View>
  );
}

function RoleTab({ active, onPress, title, sub }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tab, active && s.tabActive]}>
      <Text style={[s.tabTitle, active && { color: '#fff' }]}>{title}</Text>
      <Text style={[s.tabSub, active && { color: 'rgba(255,255,255,0.8)' }]}>{sub}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 10 },
  sub: { color: colors.muted, marginTop: 6 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tab: { flex: 1, borderRadius: radius.md, padding: 12, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line },
  tabActive: { backgroundColor: colors.violet, borderColor: 'transparent' },
  tabTitle: { color: colors.muted, fontWeight: '700' },
  tabSub: { color: colors.faint, fontSize: 11, marginTop: 2 },
  label: { color: colors.faint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.soft, color: colors.text, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  foot: { color: colors.muted, textAlign: 'center', marginTop: 18 },
});
