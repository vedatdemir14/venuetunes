# Teknoloji Stack

## Backend — `apps/api`

| Alan | Seçim | Neden |
|---|---|---|
| Runtime | Node.js 22 LTS | Socket.IO + Spotify ekosistemi olgun |
| Framework | NestJS 11 | Modüler mimari, DI, Gateway (WS) desteği yerleşik |
| Dil | TypeScript 5 | Uçtan uca tip güvenliği (shared paketle) |
| ORM | Prisma | Tip güvenli sorgular, migration yönetimi |
| Veritabanı | PostgreSQL 16 | İlişkisel veri (istek/oy/mesaj), güvenilirlik |
| Cache/PubSub | Redis 7 | Oy sayaçları (sorted set), Socket.IO adapter, rate limit |
| Job Queue | BullMQ | Spotify sync worker, zamanlanmış işler |
| Auth | JWT (@nestjs/jwt) + Spotify OAuth PKCE | Misafir ve mekan-admin ayrımı |
| Validasyon | class-validator + class-transformer | DTO doğrulama |
| Test | Vitest + Supertest | Hızlı birim/e2e test |
| Log | pino | Yapılandırılmış, düşük maliyetli |

## Mobil — `apps/mobile`

| Alan | Seçim | Neden |
|---|---|---|
| Framework | React Native 0.7x + Expo SDK | Hızlı geliştirme, OTA update, QR/deep link kolay |
| Dil | TypeScript | |
| State | Zustand + TanStack Query | Basit global state + sunucu senkronu |
| Realtime | socket.io-client | Backend ile aynı protokol |
| Navigasyon | Expo Router | Deep link (QR → venue/table) doğal desteği |
| UI | Tamagui veya NativeWind | Tema + performans |

## Mekan Paneli — `apps/dashboard`

| Alan | Seçim | Neden |
|---|---|---|
| Framework | React 19 + Vite | Hafif SPA |
| UI | shadcn/ui + Tailwind | Hızlı, düzenli panel arayüzü |
| Çalma | Spotify Web Playback SDK | Panel bilgisayarı = mekan hoparlör cihazı (opsiyonel) |

## Ortak — `packages/shared`

- Zod şemaları + TypeScript tipleri (API sözleşmesi tek kaynak)
- Socket.IO event isimleri ve payload tipleri
- Sabitler (limitler, hata kodları)

## Altyapı

| Alan | Seçim |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Container | Docker + docker-compose (dev) |
| CI/CD | GitHub Actions (lint → test → build) |
| Deploy (MVP) | Backend: Railway/Fly.io · Panel: Vercel · Mobil: EAS Build |
| İzleme | Sentry + Better Stack |

## Neden Bu Kombinasyon?

1. **Tek dil (TS) her yerde** → shared paketiyle API sözleşmesi derleme zamanında doğrulanır
2. **Socket.IO + Redis adapter** → hem kuyruk güncellemeleri hem sohbet aynı altyapıda, yatay ölçeklenebilir
3. **BullMQ tek-worker deseni** → Spotify rate limit ve Şubat 2026 kısıtlarıyla uyumlu, Spotify'a yazan tek nokta
4. **Expo** → QR deep link, hızlı iterasyon, mağaza süreci kolaylığı
