import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api, mediaUrl, formatMoney } from '../../src/api';
import { colors, radius } from '../../src/theme';
import { Loading } from '../../src/ui';

const CATEGORIES = ['all', 'apparel', 'accessories', 'art', 'music', 'digital', 'collectibles'];

export default function Marketplace() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');

  const load = useCallback(async () => {
    try {
      const { listings } = await api.listings({ q, category, sort: 'new' });
      setListings(listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, category]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const renderItem = ({ item }) => {
    const cover = item.media?.[0];
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => router.push(`/product/${item.id}`)}>
        <View style={s.thumb}>
          {cover ? (
            <Image source={{ uri: mediaUrl(cover.url) }} style={s.thumbImg} />
          ) : (
            <View style={[s.thumbImg, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.faint }}>No image</Text>
            </View>
          )}
          {item.media?.some((m) => m.type === 'video') && (
            <View style={s.videoBadge}><Text style={{ color: '#fff', fontSize: 10 }}>▶ Video</Text></View>
          )}
        </View>
        <Text numberOfLines={1} style={s.title}>{item.title}</Text>
        <View style={s.cardRow}>
          <Text style={s.price}>{formatMoney(item.priceCents)}</Text>
          <Text numberOfLines={1} style={s.seller}>{item.sellerName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.searchWrap}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search merch…"
          placeholderTextColor={colors.faint}
          style={s.search}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cats} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.cat, category === c && s.catActive]}>
            <Text style={[s.catText, category === c && { color: '#fff' }]}>{c[0].toUpperCase() + c.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.violet} />}
          ListEmptyComponent={<Text style={s.empty}>No merch found yet.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 12, paddingBottom: 0 },
  search: { backgroundColor: colors.soft, color: colors.text, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  cats: { maxHeight: 48, marginTop: 10 },
  cat: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, height: 36 },
  catActive: { backgroundColor: colors.violet, borderColor: 'transparent' },
  catText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  thumb: { aspectRatio: 1, backgroundColor: colors.soft },
  thumbImg: { width: '100%', height: '100%' },
  videoBadge: { position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  title: { color: colors.text, fontWeight: '600', fontSize: 13, paddingHorizontal: 10, paddingTop: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2, gap: 6 },
  price: { color: colors.text, fontWeight: '800', fontSize: 14 },
  seller: { color: colors.faint, fontSize: 11, flexShrink: 1 },
  empty: { color: colors.faint, textAlign: 'center', marginTop: 40 },
});
