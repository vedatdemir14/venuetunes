import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { JoinForm } from '../../components/JoinForm';
import { colors } from '../../lib/theme';

/** Deep link hedefi: venuetunes://join/<qrToken> — masa kodu dolu gelir */
export default function JoinByQr() {
  const { qrToken } = useLocalSearchParams<{ qrToken: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <JoinForm initialQrToken={qrToken ?? ''} />
    </View>
  );
}
