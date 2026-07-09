import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';
import { colors } from '../lib/theme';

/** QR token + takma ad ile oturuma katılım formu (QR kamera taraması Faz 2.5) */
export function JoinForm({ initialQrToken = '' }: { initialQrToken?: string }) {
  const { apiUrl, setApiUrl, setAuth } = useAppStore();
  const [qrToken, setQrToken] = useState(initialQrToken);
  const [nickname, setNickname] = useState('');
  const [url, setUrl] = useState(apiUrl);
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (busy) return;
    if (qrToken.trim().length < 8 || nickname.trim().length < 2) {
      Alert.alert('Eksik bilgi', 'Masa kodu ve en az 2 karakterlik takma ad gerekli');
      return;
    }
    setBusy(true);
    try {
      setApiUrl(url.trim());
      const res = await api.join(qrToken.trim(), nickname.trim());
      setAuth(res);
      router.replace('/(tabs)/queue');
    } catch (err) {
      Alert.alert('Katılamadın', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎵 VenueTunes</Text>
      <Text style={styles.hint}>Masandaki QR kodun altındaki kodu gir</Text>

      <TextInput
        style={styles.input}
        placeholder="Masa kodu"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        value={qrToken}
        onChangeText={setQrToken}
      />
      <TextInput
        style={styles.input}
        placeholder="Takma adın"
        placeholderTextColor={colors.textDim}
        maxLength={24}
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        style={[styles.input, styles.small]}
        placeholder="Sunucu adresi"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        keyboardType="url"
        value={url}
        onChangeText={setUrl}
      />

      <TouchableOpacity style={styles.button} onPress={join} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Katıl</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  logo: { fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center' },
  hint: { color: colors.textDim, textAlign: 'center', marginBottom: 12 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  small: { fontSize: 13, padding: 10 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
