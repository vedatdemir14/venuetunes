# 🎵 VenueTunes — Spotify Entegre Mekan Müzik & Sosyal Sistemi

Mekan müşterilerinin müzik kuyruğunu interaktif olarak etkilemesini ve kendi aralarında gerçek zamanlı mesajlaşmasını sağlayan platform.

## Konsept

- Mekan (kafe/bar/restoran) tek bir Spotify Premium hesabıyla sisteme bağlanır
- Müşteriler mobil uygulamadan şarkı arar, kuyruğa istek gönderir ve oylar
- En çok oy alan şarkılar mekanın Spotify kuyruğuna otomatik eklenir
- Müşteriler mekan içi sohbet odalarında (genel / masa bazlı) mesajlaşır

## Repo Yapısı

```
├── apps/
│   ├── api/          # NestJS backend (REST + WebSocket)
│   ├── mobile/       # React Native müşteri uygulaması
│   └── dashboard/    # Mekan yönetim paneli (React)
├── packages/
│   └── shared/       # Ortak TypeScript tipleri ve sabitler
├── docs/
│   ├── 01-spotify-api-arastirmasi.md
│   ├── 02-mimari.md
│   ├── 03-teknoloji-stack.md
│   ├── 04-veri-modeli.md
│   └── 05-yol-haritasi.md
├── docker-compose.yml
└── .github/          # CI ve şablonlar
```

## Hızlı Bakış — Teknoloji

| Katman | Teknoloji |
|---|---|
| Backend | Node.js 22, NestJS, TypeScript |
| Gerçek zamanlı | Socket.IO + Redis adapter |
| Veritabanı | PostgreSQL 16 + Prisma |
| Cache / PubSub | Redis 7 |
| Mobil | React Native (Expo) |
| Panel | React + Vite |
| Altyapı | Docker, GitHub Actions |

Detaylar: [docs/03-teknoloji-stack.md](docs/03-teknoloji-stack.md)

## ⚠️ Önemli Kısıtlar (Şubat 2026 Spotify API değişiklikleri)

- Development Mode: app başına **5 kullanıcı**, geliştirici başına **1 Client ID**, sahibin **Premium** hesabı zorunlu
- Ticari kullanım için Extended Quota Mode gerekir (tüzel şirket + 250k MAU şartı)
- Spotify tüketici hesapları hukuken **mekanda umuma açık çalma lisansı içermez**

Mimari bu kısıtlara göre tasarlandı — sadece mekan hesabı Spotify'a bağlanır, müşteriler Spotify hesabı kullanmaz. Detaylar: [docs/01-spotify-api-arastirmasi.md](docs/01-spotify-api-arastirmasi.md)

## Başlangıç (geliştirme)

```bash
git clone <repo-url>
cd venuetunes
docker compose up -d        # PostgreSQL + Redis
# apps/api ve apps/mobile kurulum adımları için ilgili README'lere bakın
```

## Lisans

MIT
