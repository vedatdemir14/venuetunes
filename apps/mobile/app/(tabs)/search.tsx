import type { TrackResult } from '@venuetunes/shared';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      try {
        setResults(await api.search(query));
      } catch (err) {
        Alert.alert('Arama başarısız', (err as Error).message);
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const requestTrack = async (track: TrackResult) => {
    try {
      await api.createRequest(track.id);
      setRequestedIds((prev) => new Set(prev).add(track.id));
      Alert.alert('İstek gönderildi 🎵', `"${track.name}" kuyruğa eklendi — oyları topla!`);
    } catch (err) {
      Alert.alert('İstek gönderilemedi', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Şarkı veya sanatçı ara..."
        placeholderTextColor={colors.textDim}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      {busy && <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !busy && query.trim().length >= 2 ? (
            <Text style={styles.empty}>Sonuç yok</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const requested = requestedIds.has(item.id);
          return (
            <View style={styles.row}>
              {item.albumArtUrl ? (
                <Image source={{ uri: item.albumArtUrl }} style={styles.art} />
              ) : (
                <View style={[styles.art, styles.artPlaceholder]} />
              )}
              <View style={styles.info}>
                <Text style={styles.track} numberOfLines={1}>
                  {item.name}
                  {item.explicit ? '  🅴' : ''}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artists}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.reqBtn, requested && styles.reqBtnDone]}
                disabled={requested}
                onPress={() => requestTrack(item)}
              >
                <Text style={[styles.reqText, requested && styles.reqTextDone]}>
                  {requested ? '✓' : 'İste'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  art: { width: 44, height: 44, borderRadius: 6 },
  artPlaceholder: { backgroundColor: colors.border },
  info: { flex: 1 },
  track: { color: colors.text, fontWeight: '600', fontSize: 15 },
  artist: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  reqBtn: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reqBtnDone: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  reqText: { color: '#fff', fontWeight: '700' },
  reqTextDone: { color: colors.textDim },
});
