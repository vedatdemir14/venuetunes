# apps/mobile — React Native (Expo) Müşteri Uygulaması

Mekan misafirlerinin şarkı aradığı, istek gönderdiği, oyladığı ve sohbet ettiği uygulama.

## Planlanan Ekranlar

```
app/
├── join/[qrToken]     # QR deep link → misafir oturumu + takma ad
├── (tabs)/
│   ├── queue          # canlı kuyruk + oylama + Now Playing
│   ├── search         # şarkı arama + istek gönderme
│   └── chat           # genel / masa sohbet odaları
└── _layout.tsx
```

## Kurulum

```bash
pnpm install                # kök klasörde
cd apps/mobile
npx expo install --fix      # Expo SDK sürüm uyumunu garantile
pnpm dev                    # Metro başlar, QR'ı Expo Go ile okut
```

Telefon ve PC aynı Wi-Fi'da olmalı. Uygulamadaki "Sunucu adresi" alanına
PC'nin LAN IP'sini yaz (ör. `http://192.168.1.20:3000` — `ipconfig` ile bak).

Notlar:
- Misafir kimliği cihazda kalıcıdır (AsyncStorage) → çoklu oy engeli
- Deep link: `venuetunes://join/<qrToken>` (QR kamera taraması: Faz 2.5)
- Metro pnpm monorepo ayarı `metro.config.js` içinde
