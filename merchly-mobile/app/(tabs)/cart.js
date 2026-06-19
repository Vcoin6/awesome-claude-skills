import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/cart';
import { mediaUrl, formatMoney } from '../../src/api';
import { colors, radius } from '../../src/theme';
import { GradientButton } from '../../src/ui';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQty, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Your cart is empty</Text>
        <Text style={s.emptySub}>Find something worth dropping into it.</Text>
        <GradientButton title="Browse merch" onPress={() => router.push('/(tabs)')} style={{ marginTop: 18, width: 200 }} />
      </View>
    );
  }

  const fee = Math.round(subtotal * 0.05);
  const sellerNet = subtotal - fee;

  return (
    <View style={s.screen}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Image source={{ uri: mediaUrl(item.cover) }} style={s.thumb} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={s.title}>{item.title}</Text>
              <Text style={s.seller}>by {item.sellerName}</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity onPress={() => updateQty(item.id, item.qty - 1)} style={s.qtyBtn}><Text style={s.qtyTxt}>−</Text></TouchableOpacity>
                <Text style={s.qty}>{item.qty}</Text>
                <TouchableOpacity onPress={() => updateQty(item.id, item.qty + 1)} style={s.qtyBtn}><Text style={s.qtyTxt}>+</Text></TouchableOpacity>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.price}>{formatMoney(item.priceCents * item.qty)}</Text>
              <TouchableOpacity onPress={() => remove(item.id)}><Text style={s.remove}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={s.summary}>
        <Row label="Subtotal" value={formatMoney(subtotal)} bold />
        <Row label="To seller (95%)" value={formatMoney(sellerNet)} />
        <Row label="Merchly fee (5%)" value={formatMoney(fee)} />
        <GradientButton title={`Checkout · ${formatMoney(subtotal)}`} onPress={() => router.push('/checkout')} style={{ marginTop: 12 }} />
      </View>
    </View>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emptySub: { color: colors.muted, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 10 },
  thumb: { width: 74, height: 74, borderRadius: radius.md, backgroundColor: colors.soft },
  title: { color: colors.text, fontWeight: '600' },
  seller: { color: colors.faint, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, alignSelf: 'flex-start' },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  qtyTxt: { color: colors.muted, fontSize: 16 },
  qty: { color: colors.text, width: 26, textAlign: 'center' },
  price: { color: colors.text, fontWeight: '700' },
  remove: { color: colors.faint, fontSize: 12, marginTop: 8 },
  summary: { borderTopWidth: 1, borderTopColor: colors.line, padding: 16, backgroundColor: colors.soft, gap: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { color: colors.muted },
  sumValue: { color: colors.text },
});
