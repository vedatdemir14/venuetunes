# Spotify API Araştırması (Temmuz 2026)

## 1. Bize Ne Sağlıyor?

### Web API — Player (projenin kalbi)

| Endpoint | İşlev | Not |
|---|---|---|
| `POST /me/player/queue` | Kuyruğa şarkı ekle | **Premium zorunlu** — ana özelliğimiz |
| `GET /me/player/queue` | Mevcut kuyruğu oku | |
| `GET /me/player/currently-playing` | Çalan şarkı | Now Playing ekranı için |
| `PUT /me/player/play` / `pause` | Başlat / duraklat | Mekan paneli kontrolü |
| `POST /me/player/next` | Sonraki şarkı | |
| `GET /me/player/devices` | Cihaz listesi | Spotify Connect cihaz seçimi |
| `PUT /me/player/volume` | Ses kontrolü | |

### Web API — İçerik

| Endpoint | İşlev | Not |
|---|---|---|
| `GET /search` | Şarkı arama | **Limit maks. 10/istek** (Şubat 2026), offset ile sayfalama |
| `GET /tracks/{id}` | Şarkı detayı | Toplu (batch) endpoint kaldırıldı — tek tek çekilir |
| `GET /playlists/{id}/items` | Playlist içeriği | Sadece sahip olunan playlistler |

### Web Playback SDK
Tarayıcıyı Spotify Connect cihazına çevirir. Mekan paneli (dashboard) doğrudan hoparlöre bağlı bilgisayarda çalar cihaz olabilir. Premium gerektirir.

### Kimlik Doğrulama
- **Authorization Code + PKCE**: Mekan sahibinin hesabını bağlamak için. Refresh token backend'de saklanır, access token ~1 saatte yenilenir.
- **Client Credentials**: Kullanıcı bağlamı gerektirmeyen aramalar için uygun değil (search artık kullanıcı token'ı istiyor senaryomuzda tercih edilmez).
- Gerekli scope'lar: `user-modify-playback-state`, `user-read-playback-state`, `user-read-currently-playing`, `streaming` (SDK için).

## 2. Kritik Kısıtlar

### Şubat 2026 Development Mode Değişiklikleri
Kaynak: [Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [Resmi duyuru](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)

- App başına **maks. 5 kullanıcı**, geliştirici başına **1 Client ID**
- App sahibinin **aktif Premium aboneliği** zorunlu (biterse app durur)
- `GET /search` limiti 50 → **10**, varsayılan 5
- Kaldırılan endpoint'ler: batch fetch (`GET /tracks?ids=`), `browse/*`, `artists/{id}/top-tracks`, başka kullanıcıların profil/playlistleri
- Kaldırılan alanlar: `popularity`, `available_markets`, `followers` vb.
- Playlist `tracks` → `items` yeniden adlandırması

**Bizim için anlamı:** Müşteriler asla Spotify'a login olmaz → "kullanıcı" sayılmaz. Sadece mekan hesapları app kullanıcısıdır → Dev Mode'da **5 mekana kadar pilot** yapılabilir.

### Extended Quota Mode (ticari ölçek)
- Sadece **tüzel şirketler** başvurabilir (Mayıs 2025'ten beri bireysel başvuru kapalı)
- **250.000 MAU** ve yayında bir servis şartı → başlangıç için erişilmez
- Strateji: Dev Mode'da pilot → traction → şirketleşme → başvuru

### Hukuki Uyarı ⚠️
Spotify tüketici hesapları **umuma açık yerlerde müzik çalma lisansı içermez** (Kullanım Koşulları: yalnızca kişisel kullanım). Mekanda yasal çalma için:
- **Soundtrack Your Business** (Spotify'ın B2B çözümü, ayrı API'si var) — üretim için değerlendirilmeli
- Türkiye'de ayrıca MESAM/MSG gibi meslek birlikleri umuma iletim lisansı gerektirir

Bu repo teknik bir MVP/prototip olarak Dev Mode kısıtlarında tasarlanmıştır; ticarileşme öncesi lisanslama çözülmelidir.

### Rate Limit
- 30 saniyelik pencerede hesaplanır, aşımda `429 + Retry-After`
- Önlem: arama sonuçlarını Redis'te cache'le, kuyruğa ekleme işlemlerini tek worker üzerinden sırayla yap

## 3. Alternatifler (B planı)

| Alternatif | Artı | Eksi |
|---|---|---|
| Soundtrack Your Business API | Mekanlar için yasal, ticari lisanslı | Ücretli abonelik, katalog farkı |
| YouTube Music (resmi API yok) | — | API yok, ToS riski |
| Apple Music API | MusicKit var | Kuyruk kontrolü sınırlı, mekan senaryosuna uygun değil |

## Kaynaklar

- [Web API Genel Bakış](https://developer.spotify.com/documentation/web-api)
- [Add to Queue Reference](https://developer.spotify.com/documentation/web-api/reference/add-to-queue)
- [Şubat 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Quota Modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [TechCrunch — Şubat 2026 değişiklik haberi](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
