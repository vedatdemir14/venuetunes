import type { NowPlayingPayload, QueueItemPayload } from '@venuetunes/shared';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import { closeSocket, getSocket } from '../../lib/socket';
import { useAppStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function QueueScreen() {
  const { session, clearAuth } = useAppStore();
  const [queue, setQueue] = useState<QueueItemPayload[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setQueue(await api.getQueue());
    } catch {
      /* ilk yükleme hatası kritik değil — WS güncellemeleri gelecek */
    }
  }, []);

  useEffect(() => {
    void load();
    const socket = getSocket();

    socket.on('queue:updated', setQueue);
    socket.on('nowplaying:changed', setNowPlaying);
    socket.on('track:queued', (item) => {
      Alert.alert('Sıradaki şarkı 🎵', `"${item.trackName}" birazdan çalacak!`);
    });
    socket.on('session:closed', () => {
      Alert.alert('Oturum kapandı', 'Mekan bu oturumu sonlandırdı.');
      closeSocket();
      clearAuth();
      router.replace('/');
    });

    return () => {
      socket.off('queue:updated');
      socket.off('nowplaying:changed');
      socket.off('track:queued');
      socket.off('session:closed');
    };
  }, [load, clearAuth]);

  const vote = async (item: QueueItemPayload) => {
    try {
      await api.vote(item.requestId, 1);
    } catch (err) {
      Alert.alert('Oy verilemedi', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      {nowPlaying?.trackUri && (
        <View style={styles.nowPlaying}>
          {nowPlaying.albumArtUrl && (
            <Image source={{ uri: nowPlaying.albumArtUrl }} style={styles.npArt} />
          )}
          <View style={styles.npInfo}>
            <Text style={styles.npLabel}>
              {nowPlaying.isPlaying ? '▶ ŞİMDİ ÇALIYOR' : '⏸ DURAKLATILDI'}
            </Text>
            <Text style={styles.npTrack} numberOfLines={1}>
              {nowPlaying.trackName}
            </Text>
            <Text style={styles.npArtist} numberOfLines={1}>
              {nowPlaying.artistName}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.heading}>{session?.venueName} — İstek Kuyruğu</Text>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.requestId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Kuyruk boş — ilk şarkıyı sen iste! 🎤</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            {item.albumArtUrl ? (
              <Image source={{ uri: item.albumArtUrl }} style={styles.art} />
            ) : (
              <View style={[styles.art, styles.artPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.track} numberOfLines={1}>
                {item.trackName}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artistName} · {item.requestedBy}
              </Text>
            </View>
            <TouchableOpacity style={styles.voteBtn} onPress={() => vote(item)}>
              <Text style={styles.voteText}>👍 {item.score}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  nowPlaying: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    gap: 12,
  },
  npArt: { width: 56, height: 56, borderRadius: 8 },
  npInfo: { flex: 1 },
  npLabel: { color: colors.accent, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  npTrack: { color: colors.text, fontSize: 16, fontWeight: '700' },
  npArtist: { color: colors.textDim, fontSize: 13 },
  heading: { color: colors.textDim, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 48, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  rank: { color: colors.textDim, width: 20, textAlign: 'center', fontWeight: '700' },
  art: { width: 44, height: 44, borderRadius: 6 },
  artPlaceholder: { backgroundColor: colors.border },
  info: { flex: 1 },
  track: { color: colors.text, fontWeight: '600', fontSize: 15 },
  artist: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  voteBtn: {
    backgroundColor: colors.bg,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  voteText: { color: colors.accent, fontWeight: '700' },
});
