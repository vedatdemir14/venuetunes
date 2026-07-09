import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'venuetunes-device-id';

/** Cihaz başına kalıcı rastgele kimlik (çoklu oy engeli için sunucuya gider) */
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  await AsyncStorage.setItem(KEY, id);
  return id;
}
