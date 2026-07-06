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

## Kurulum (Faz 2'de doldurulacak)

```bash
pnpm install
pnpm expo start
```
