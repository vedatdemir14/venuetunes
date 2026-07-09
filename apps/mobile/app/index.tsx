import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JoinForm } from '../components/JoinForm';
import { useAppStore } from '../lib/store';
import { colors } from '../lib/theme';

export default function Home() {
  const { token, session, clearAuth } = useAppStore();

  return (
    <View style={styles.container}>
      <JoinForm />
      {token && session && (
        <View style={styles.resume}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/queue')}>
            <Text style={styles.resumeText}>▶ {session.venueName} oturumuna devam et</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAuth}>
            <Text style={styles.leaveText}>Oturumdan ayrıl</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  resume: { padding: 24, gap: 10, alignItems: 'center' },
  resumeText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  leaveText: { color: colors.textDim, fontSize: 13 },
});
