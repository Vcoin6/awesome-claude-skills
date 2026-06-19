import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/auth';
import { colors, radius } from '../../src/theme';
import { GradientButton, GhostButton } from '../../src/ui';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={s.gate}>
        <Text style={s.title}>Your Merchly account</Text>
        <Text style={s.sub}>Log in or create an account to sell merch and track orders.</Text>
        <GradientButton title="Create account" onPress={() => router.push('/register')} style={{ marginTop: 20, width: 220 }} />
        <GhostButton title="Log in" onPress={() => router.push('/login')} style={{ marginTop: 10, width: 220 }} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.head}>
        <LinearGradient colors={[colors.violet, colors.fuchsia]} style={s.avatar}>
          <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
        </LinearGradient>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={s.rolePill}>
          <Text style={s.roleText}>{user.role === 'seller' ? 'Seller' : 'Shopper'}</Text>
        </View>
      </View>

      {user.role === 'seller' && (
        <TouchableOpacity style={s.rowBtn} onPress={() => router.push('/(tabs)/dashboard')}>
          <Text style={s.rowText}>Seller dashboard</Text>
          <Text style={s.chev}>›</Text>
        </TouchableOpacity>
      )}
      <View style={s.rowBtn}>
        <Text style={s.rowText}>Payouts</Text>
        <Text style={[s.rowMeta, { color: user.payoutsEnabled ? colors.green : colors.amber }]}>
          {user.payoutsEnabled ? 'Active' : 'Setup needed'}
        </Text>
      </View>

      <GhostButton title="Sign out" onPress={logout} style={{ margin: 16 }} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  head: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
  email: { color: colors.muted, marginTop: 2 },
  rolePill: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  roleText: { color: colors.fuchsia, fontWeight: '700', fontSize: 12 },
  rowBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  rowText: { color: colors.text, fontWeight: '600' },
  rowMeta: { fontWeight: '700' },
  chev: { color: colors.faint, fontSize: 22 },
});
