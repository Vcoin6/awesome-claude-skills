// Small shared UI primitives.
import { Text, TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from './theme';

export function GradientButton({ title, onPress, disabled, loading, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
      <LinearGradient
        colors={[colors.violet, colors.fuchsia, colors.amber]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.btn}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({ title, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[s.ghost, style]}>
      <Text style={s.ghostText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Pill({ label, tint = colors.violet }) {
  return (
    <View style={[s.pill, { backgroundColor: tint + '22' }]}>
      <Text style={[s.pillText, { color: tint }]}>{label}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.violet} size="large" />
    </View>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ghost: {
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.line,
  },
  ghostText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
