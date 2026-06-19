import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { api, formatMoney } from '../src/api';
import { useCart } from '../src/cart';
import { useAuth } from '../src/auth';
import { colors, radius } from '../src/theme';
import { GradientButton } from '../src/ui';

export default function Checkout() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const fee = Math.round(subtotal * 0.05);
  const sellerNet = subtotal - fee;

  async function pay() {
    if (!name || !email) {
      Alert.alert('Missing info', 'Please enter your name and email.');
      return;
    }
    setLoading(true);
    try {
      // 1) Create order(s) + payment intent on the server.
      const res = await api.checkout({
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        buyer: { name, email },
      });

      // 2a) Stripe mode: present the native PaymentSheet to capture the card.
      if (res.mode === 'stripe' && res.clientSecret) {
        const init = await initPaymentSheet({
          merchantDisplayName: 'Merchly',
          paymentIntentClientSecret: res.clientSecret,
          defaultBillingDetails: { name, email },
          allowsDelayedPaymentMethods: false,
        });
        if (init.error) throw new Error(init.error.message);

        const { error } = await presentPaymentSheet();
        if (error) {
          // User cancelled or card failed — order stays pending, no payout.
          if (error.code !== 'Canceled') Alert.alert('Payment failed', error.message);
          setLoading(false);
          return;
        }
      }
      // 2b) Simulation mode: the server already settled the split.

      clear();
      router.replace({
        pathname: '/(tabs)',
      });
      Alert.alert(
        'Order confirmed 🎉',
        `Paid ${formatMoney(res.summary.amount)} · Sellers receive ${formatMoney(res.summary.sellerNet)} (95%) · Merchly fee ${formatMoney(res.summary.platformFee)} (5%).`
      );
    } catch (e) {
      Alert.alert('Checkout error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.h2}>Contact</Text>
      <View style={s.card}>
        <Text style={s.label}>Full name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.faint} />
        <Text style={[s.label, { marginTop: 12 }]}>Email (for receipt)</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.faint} />
      </View>

      <Text style={s.h2}>Order</Text>
      <View style={s.card}>
        {items.map((i) => (
          <View key={i.id} style={s.itemRow}>
            <Text numberOfLines={1} style={s.itemTitle}>{i.qty}× {i.title}</Text>
            <Text style={s.itemPrice}>{formatMoney(i.priceCents * i.qty)}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <Row label="Subtotal" value={formatMoney(subtotal)} bold />
        <Row label="To seller (95%)" value={formatMoney(sellerNet)} />
        <Row label="Merchly fee (5%)" value={formatMoney(fee)} />
      </View>

      <GradientButton title={`Pay ${formatMoney(subtotal)}`} onPress={pay} loading={loading} style={{ marginTop: 18 }} />
      <Text style={s.note}>Payments secured by Stripe · Sellers paid 95% automatically</Text>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={s.sumRow}>
      <Text style={[s.sumLabel, bold && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <Text style={[s.sumValue, bold && { fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  h2: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  label: { color: colors.faint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: colors.soft, color: colors.text, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: colors.line },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemTitle: { color: colors.muted, flex: 1, marginRight: 8 },
  itemPrice: { color: colors.text },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  sumLabel: { color: colors.muted },
  sumValue: { color: colors.text },
  note: { color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
