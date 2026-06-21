import { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api, uploadAssets, mediaUrl, formatMoney } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radius } from '../../src/theme';
import { GradientButton, GhostButton } from '../../src/ui';

export default function Dashboard() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [summary, setSummary] = useState(null);
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (user?.role !== 'seller') return;
    try {
      const [orders, mine] = await Promise.all([
        api.sellerOrders(),
        api.listings({ seller: user.id }),
      ]);
      setSummary(orders.summary);
      setListings(mine.listings || []);
    } catch {}
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Logged-out / shopper state.
  if (!user) {
    return (
      <View style={s.gate}>
        <Text style={s.gateTitle}>Sell your merch. Keep 95%.</Text>
        <Text style={s.gateSub}>Create a seller account to upload photos & video and start earning.</Text>
        <GradientButton title="Start selling" onPress={() => router.push('/register')} style={{ marginTop: 18, width: 220 }} />
        <GhostButton title="Log in" onPress={() => router.push('/login')} style={{ marginTop: 10, width: 220 }} />
      </View>
    );
  }
  if (user.role !== 'seller') {
    return (
      <View style={s.gate}>
        <Text style={s.gateTitle}>You’re shopping with Merchly</Text>
        <Text style={s.gateSub}>Want to sell too? Create a seller account to list your merch.</Text>
        <GradientButton title="Become a seller" onPress={() => router.push('/register')} style={{ marginTop: 18, width: 220 }} />
      </View>
    );
  }

  async function enablePayouts() {
    try {
      const res = await api.onboard();
      if (res.url) {
        Alert.alert('Finish in browser', 'Complete Stripe onboarding to receive payouts.');
        // In a full build, open res.url with expo-web-browser.
      } else {
        await refresh();
        Alert.alert('Payouts enabled', 'You can now receive your 95% on every sale.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.violet} />}
    >
      {!user.payoutsEnabled && (
        <TouchableOpacity onPress={enablePayouts} style={s.banner}>
          <Text style={s.bannerText}>Enable payouts to receive your 95% →</Text>
        </TouchableOpacity>
      )}

      <View style={s.stats}>
        <Stat label="Net (95%)" value={formatMoney(summary?.netCents || 0)} accent />
        <Stat label="Gross" value={formatMoney(summary?.grossCents || 0)} />
        <Stat label="Fees (5%)" value={formatMoney(summary?.feeCents || 0)} />
        <Stat label="Units sold" value={String(summary?.unitsSold || 0)} />
      </View>

      {showForm ? (
        <NewListingForm onDone={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      ) : (
        <GradientButton title="+ New listing" onPress={() => setShowForm(true)} style={{ marginTop: 16 }} />
      )}

      <Text style={s.h2}>Your listings ({listings.length})</Text>
      {listings.map((l) => (
        <TouchableOpacity key={l.id} style={s.listing} onPress={() => router.push(`/product/${l.id}`)}>
          <Image source={{ uri: mediaUrl(l.media?.[0]?.url) }} style={s.listThumb} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={s.listTitle}>{l.title}</Text>
            <Text style={s.listMeta}>{formatMoney(l.priceCents)} · {l.stock} in stock · {l.views || 0} views</Text>
          </View>
        </TouchableOpacity>
      ))}
      {listings.length === 0 && <Text style={s.empty}>No listings yet. Tap “New listing” to drop your first merch.</Text>}
    </ScrollView>
  );
}

function NewListingForm({ onDone, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('25');
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // null = none/indeterminate, 0–100 = pct

  async function pickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to add media.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    setBusy(true);
    setProgress(0);
    try {
      // Direct-to-Blob when configured (no size limit), else multipart fallback.
      const uploaded = await uploadAssets(result.assets, (pct) => setProgress(pct));
      setMedia((m) => [...m, ...uploaded]);
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function publish() {
    if (!title || !price) return Alert.alert('Missing info', 'Add a title and price.');
    if (media.length === 0) return Alert.alert('Add media', 'Add at least one photo or video.');
    setBusy(true);
    try {
      await api.createListing({
        title,
        description,
        price: Number(price),
        stock: Number(stock),
        category: 'apparel',
        media,
      });
      onDone();
    } catch (e) {
      Alert.alert('Could not publish', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[s.card, { marginTop: 16 }]}>
      <View style={s.formHead}>
        <Text style={s.h2b}>Drop new merch</Text>
        <TouchableOpacity onPress={onCancel}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
      </View>

      <TouchableOpacity onPress={pickMedia} disabled={busy} style={s.uploader}>
        <Text style={s.uploaderText}>
          {busy ? (progress != null ? `Uploading ${progress}%` : 'Uploading…') : '+ Add photos & video'}
        </Text>
      </TouchableOpacity>
      {busy && (
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress ?? 15}%` }]} />
        </View>
      )}
      {media.length > 0 && (
        <ScrollView horizontal style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {media.map((m, i) => (
            <Image key={i} source={{ uri: mediaUrl(m.url) }} style={s.preview} />
          ))}
        </ScrollView>
      )}

      <Text style={s.label}>Title</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Limited Tour Hoodie" placeholderTextColor={colors.faint} />
      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Materials, sizing, drop story…" placeholderTextColor={colors.faint} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Price (USD)</Text>
          <TextInput style={s.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="40.00" placeholderTextColor={colors.faint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Stock</Text>
          <TextInput style={s.input} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholderTextColor={colors.faint} />
        </View>
      </View>

      {!!price && (
        <Text style={s.earn}>You’ll earn {formatMoney(Math.round(Number(price) * 100 * 0.95))} per sale · fee {formatMoney(Math.round(Number(price) * 100 * 0.05))}</Text>
      )}

      <GradientButton title="Publish listing" onPress={publish} loading={busy} style={{ marginTop: 14 }} />
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, accent && { color: colors.fuchsia }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  gateTitle: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  gateSub: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  banner: { backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', padding: 12, marginBottom: 14 },
  bannerText: { color: colors.amber, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12 },
  statLabel: { color: colors.faint, fontSize: 11, textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  h2: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 22, marginBottom: 10 },
  h2b: { color: colors.text, fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  formHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cancel: { color: colors.faint },
  uploader: { borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 22, alignItems: 'center' },
  uploaderText: { color: colors.muted, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.fuchsia },
  preview: { width: 70, height: 70, borderRadius: radius.sm, backgroundColor: colors.soft },
  label: { color: colors.faint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colors.soft, color: colors.text, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: colors.line },
  earn: { color: colors.muted, fontSize: 13, marginTop: 12 },
  listing: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 10, marginBottom: 8 },
  listThumb: { width: 54, height: 54, borderRadius: radius.sm, backgroundColor: colors.soft },
  listTitle: { color: colors.text, fontWeight: '600' },
  listMeta: { color: colors.faint, fontSize: 12, marginTop: 3 },
  empty: { color: colors.faint, textAlign: 'center', marginTop: 10 },
});
