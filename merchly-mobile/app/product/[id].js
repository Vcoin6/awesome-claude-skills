import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, mediaUrl, formatMoney } from '../../src/api';
import { useCart } from '../../src/cart';
import { colors, radius } from '../../src/theme';
import { GradientButton, GhostButton, Loading, Pill } from '../../src/ui';

const W = Dimensions.get('window').width;

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { add } = useCart();
  const [listing, setListing] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.listing(id).then((d) => setListing(d.listing)).catch(() => setListing(null));
  }, [id]);

  if (!listing) return <Loading />;

  const media = listing.media || [];
  const soldOut = listing.stock <= 0;

  function buyNow() {
    add(listing, 1);
    router.push('/checkout');
  }
  function addToCart() {
    add(listing, 1);
    Alert.alert('Added to cart', `${listing.title} is in your cart.`);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / W))}
      >
        {media.map((m, i) => (
          <Image key={i} source={{ uri: mediaUrl(m.url) }} style={{ width: W, height: W }} />
        ))}
      </ScrollView>
      {media.length > 1 && (
        <View style={s.dots}>
          {media.map((_, i) => (
            <View key={i} style={[s.dot, i === active && { backgroundColor: colors.fuchsia }]} />
          ))}
        </View>
      )}

      <View style={s.body}>
        <Text style={s.seller}>by {listing.sellerName}</Text>
        <Text style={s.title}>{listing.title}</Text>
        <View style={s.row}>
          <Text style={s.price}>{formatMoney(listing.priceCents)}</Text>
          {soldOut ? <Pill label="Sold out" tint={colors.red} />
            : listing.stock <= 5 ? <Pill label={`Only ${listing.stock} left`} tint={colors.amber} />
            : <Pill label="In stock" tint={colors.green} />}
        </View>

        {!!listing.description && <Text style={s.desc}>{listing.description}</Text>}

        {listing.tags?.length > 0 && (
          <View style={s.tags}>
            {listing.tags.map((t) => (
              <View key={t} style={s.tag}><Text style={s.tagText}>#{t}</Text></View>
            ))}
          </View>
        )}

        <View style={{ gap: 10, marginTop: 20 }}>
          <GradientButton title={soldOut ? 'Sold out' : 'Buy now'} onPress={buyNow} disabled={soldOut} />
          <GhostButton title="Add to cart" onPress={addToCart} />
        </View>

        <Text style={s.note}>Secure checkout · Seller receives 95% · Merchly buyer protection</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.line },
  body: { padding: 18 },
  seller: { color: colors.muted, fontSize: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  price: { color: colors.text, fontSize: 24, fontWeight: '800' },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.line },
  tagText: { color: colors.faint, fontSize: 12 },
  note: { color: colors.faint, fontSize: 12, marginTop: 16, textAlign: 'center' },
});
