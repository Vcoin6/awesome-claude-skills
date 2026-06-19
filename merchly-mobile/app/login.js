import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth';
import { colors, radius } from '../src/theme';
import { GradientButton } from '../src/ui';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.back();
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.screen}>
      <Text style={s.title}>Welcome back</Text>
      <Text style={s.sub}>Log in to manage your store and orders.</Text>

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.faint} />
      <Text style={s.label}>Password</Text>
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.faint} />

      <GradientButton title="Log in" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
      <Text style={s.foot} onPress={() => router.replace('/register')}>New to Merchly? <Text style={{ color: colors.fuchsia }}>Create an account</Text></Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 10 },
  sub: { color: colors.muted, marginTop: 6, marginBottom: 10 },
  label: { color: colors.faint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.soft, color: colors.text, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  foot: { color: colors.muted, textAlign: 'center', marginTop: 18 },
});
