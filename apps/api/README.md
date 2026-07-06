# apps/api — NestJS Backend

REST API + Socket.IO gateway + Spotify sync worker.

## Planlanan Modül Yapısı

```
src/
├── auth/        # misafir JWT + mekan-admin + Spotify OAuth PKCE
├── venues/      # mekan CRUD, ayarlar, QR üretimi
├── sessions/    # oturum aç/kapat, misafir katılımı
├── search/      # Spotify arama proxy + Redis cache
├── requests/    # şarkı istekleri + kurallar
├── votes/       # oylama
├── queue/       # iç kuyruk skorlama + sync worker (BullMQ)
├── chat/        # odalar, mesajlar, moderasyon
├── spotify/     # Spotify API client, token yönetimi
└── gateway/     # Socket.IO event'leri
```

## Kurulum (Faz 0'da doldurulacak)

```bash
pnpm install
cp .env.example .env   # SPOTIFY_CLIENT_ID, DATABASE_URL, REDIS_URL, JWT_SECRET
pnpm prisma migrate dev
pnpm start:dev
```
