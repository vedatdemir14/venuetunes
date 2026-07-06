# Yol Haritası

## Faz 0 — Temel ✅ (tamamlandı: 2026-07-06)
- [x] Monorepo kurulumu (pnpm + Turborepo), CI pipeline
- [x] Spotify Developer app kaydı (Dev Mode, Premium hesapla)
- [x] NestJS iskeleti: auth, config, Prisma şeması, docker-compose
- [x] Spotify OAuth PKCE bağlama akışı + token yenileme

## Faz 1 — Çekirdek Kuyruk ✅ (tamamlandı: 2026-07-06)
- [x] Arama proxy + Redis cache (limit 10 sayfalama)
- [x] İstek oluşturma + kurallar (limit, tekrar penceresi, explicit)
- [x] Oylama + Redis sorted set skorlama
- [x] Sync Worker: BullMQ, `POST /me/player/queue`, 429 backoff
- [x] Socket.IO: `queue:updated`, `track:queued`, `nowplaying:changed`
- [x] Uçtan uca saha testi (gerçek cihazla — "Kış Güneşi" kuyruğa otomatik eklendi 🎵)

## Faz 2 — Mobil Uygulama (3-4 hafta)
- [ ] Expo kurulumu, QR deep link → misafir oturumu
- [ ] Arama, istek, oylama ekranları + canlı kuyruk
- [ ] Now Playing ekranı

## Faz 3 — Sohbet (2 hafta)
- [ ] Oda yapısı (genel + masa), mesaj geçmişi
- [ ] Moderasyon: küfür filtresi, raporlama, hız limiti
- [ ] Mobil sohbet UI

## Faz 4 — Mekan Paneli (2-3 hafta)
- [ ] OAuth bağlama, cihaz seçimi, QR üretimi
- [ ] Kuyruk yönetimi: veto, öne alma, kara liste
- [ ] Sohbet moderasyon paneli
- [ ] (Ops.) Web Playback SDK ile panelden çalma

## Faz 5 — Pilot & Sertleştirme
- [ ] 1-2 gerçek mekanda pilot (Dev Mode 5 mekan sınırı içinde)
- [ ] Yük testi (WS bağlantı sayısı), Sentry, log/metrik
- [ ] Güvenlik gözden geçirme

## Ticarileşme Kapısı (kod dışı)
- [ ] Umuma iletim lisa