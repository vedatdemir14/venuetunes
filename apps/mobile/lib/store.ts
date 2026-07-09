import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface GuestInfo {
  id: string;
  nickname: string;
  tableNo: number | null;
}

interface SessionInfo {
  id: string;
  venueName: string;
}

interface AppState {
  /** API adresi — telefon PC'ye LAN üzerinden erişir (ör. http://192.168.1.20:3000) */
  apiUrl: string;
  token: string | null;
  guest: GuestInfo | null;
  session: SessionInfo | null;
  setApiUrl: (url: string) => void;
  setAuth: (auth: { token: string; guest: GuestInfo; session: SessionInfo }) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiUrl: 'http://192.168.1.20:3000',
      token: null,
      guest: null,
      session: null,
      setApiUrl: (apiUrl) => set({ apiUrl: apiUrl.replace(/\/+$/, '') }),
      setAuth: ({ token, guest, session }) => set({ token, guest, session }),
      clearAuth: () => set({ token: null, guest: null, session: null }),
    }),
    {
      name: 'venuetunes-app',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
