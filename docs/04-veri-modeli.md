# Veri Modeli

## ER Diyagramı

```mermaid
erDiagram
    VENUE ||--o{ VENUE_SESSION : "açar"
    VENUE ||--o{ TABLE_QR : "sahip"
    VENUE ||--|| SPOTIFY_CONNECTION : "bağlı"
    VENUE_SESSION ||--o{ GUEST : "barındırır"
    VENUE_SESSION ||--o{ TRACK_REQUEST : "içerir"
    VENUE_SESSION ||--o{ CHAT_ROOM : "içerir"
    GUEST ||--o{ TRACK_REQUEST : "oluşturur"
    GUEST ||--o{ VOTE : "verir"
    GUEST ||--o{ MESSAGE : "yazar"
    TRACK_REQUEST ||--o{ VOTE : "alır"
    CHAT_ROOM ||--o{ MESSAGE : "içerir"

    VENUE {
        uuid id PK
        string name
        string slug UK
        jsonb settings "limitler, explicit filtresi, tekrar penceresi"
        timestamptz created_at
    }
    SPOTIFY_CONNECTION {
        uuid venue_id PK_FK
        text refresh_token_enc "şifreli"
        string spotify_user_id
        string active_device_id
        timestamptz token_expires_at
    }
    VENUE_SESSION {
        uuid id PK
        uuid venue_id FK
        string status "active|closed"
        timestamptz opened_at
        timestamptz closed_at
    }
    TABLE_QR {
        uuid id PK
        uuid venue_id FK
        int table_no
        string qr_token UK
    }
    GUEST {
        uuid id PK
        uuid session_id FK
        string nickname
        string device_hash
        int table_no
        string status "active|muted|banned"
        timestamptz joined_at
    }
    TRACK_REQUEST {
        uuid id PK
        uuid session_id FK
        uuid guest_id FK
        string spotify_track_uri
        string track_name
        string artist_name
        string album_art_url
        int duration_ms
        string status "pending|queued|played|vetoed|expired"
        int final_score
        timestamptz created_at
        timestamptz queued_at
    }
    VOTE {
        uuid id PK
        uuid request_id FK
        uuid guest_id FK
        smallint value "+1 | -1"
        timestamptz created_at
    }
    CHAT_ROOM {
        uuid id PK
        uuid session_id FK
        string type "general|table"
        int table_no "nullable"
    }
    MESSAGE {
        uuid id PK
        uuid room_id FK
        uuid guest_id FK
        text content
        string status "visible|hidden|flagged"
        timestamptz created_at
    }
```

## Notlar

- **Canlı oy sayaçları PostgreSQL'de değil Redis'te tutulur** (`zset: session:{id}:queue`); `VOTE` tablosu denetim/analitik içindir. Şarkı kuyruğa girince skor `final_score` olarak kalıcılaştırılır.
- `GUEST` benzersizliği: `(session_id, device_hash)` — aynı cihaz aynı oturumda tek misafir → çoklu oy engeli.
- `VOTE` benzersizliği: `(request_id, guest_id)` — kişi başı istek başına tek oy.
- Mesajlar için saklama politikası: oturum kapanınca 30 gün sonra anonimleştir/sil (KVKK).
- `settings` jsonb örneği:

```json
{
  "maxActiveRequestsPerGuest": 2,
  "repeatWindowMinutes": 90,
  "explicitFilter": true,
  "voteMode": "up_only",
  "autoQueueThresholdSec": 20,
  "blacklistedTrackUris": []
}
```

## Redis Anahtar Şeması

| Anahtar | Tip | Amaç |
|---|---|---|
| `session:{id}:queue` | zset | istek skorları (member=requestId) |
| `search:{hash}` | string (5 dk TTL) | Spotify arama cache |
| `venue:{id}:token` | string | access token (TTL=expires_in) |
| `ratelimit:{guestId}:{action}` | counter | istek/oy/mesaj hız limiti |
| `venue:{id}:nowplaying` | hash | çalan şarkı durumu (worker yazar) |
