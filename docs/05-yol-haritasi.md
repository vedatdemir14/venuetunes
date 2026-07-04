# Yol Haritası

## Faz 0 — Temel (1-2 hafta)
- [ ] Monorepo kurulumu (pnpm + Turborepo), CI pipeline
- [ ] Spotify Developer app kaydı (Dev Mode, Premium hesapla)
- [ ] NestJS iskeleti: auth, config, Prisma şeması, docker-compose
- [ ] Spotify OAuth PKCE bağlama akışı + token yenileme

## Faz 1 — Çekirdek Kuyruk (2-3 hafta)
- [ ] Arama proxy + Redis cache (limit 10 sayfalama)
- [ ] İstek oluşturma + kurallar (limit, tekrar penceresi, explicit)
- [ ] Oylama + Redis sorted set skorlama
- [ ] Sync Worker: BullMQ, `POST /me/player/queue`, 429 backoff
- [ ] Socket.IO: `queue:updated`, `track:queued`, `nowplaying:changed`

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
- [ ] Umuma iletim lisansı araştırması (MESAM/MSG + Soundtrack Your Business)
- [ ] Şirketleşme → Spotify Extended Quota başvuru koşulları takibi
