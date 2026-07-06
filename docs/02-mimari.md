# Sistem Mimarisi

## 1. Genel Bakış

Temel tasarım kararı: **Müşteriler Spotify'a hiç dokunmaz.** Sadece mekanın Spotify hesabı backend'e bağlıdır. Müşteri istekleri bizim iç kuyruğumuzda toplanır, oylanır ve tek bir worker en çok oy alanı Spotify kuyruğuna iter. Bu sayede Şubat 2026 "5 kullanıcı" limiti sadece mekan hesaplarını sayar.

```mermaid
flowchart TB
    subgraph Musteri["📱 Müşteri (React Native)"]
        M1[Şarkı Ara] --> M2[İstek Gönder]
        M3[Oy Ver]
        M4[Sohbet]
    end

    subgraph Backend["⚙️ NestJS Backend"]
        GW[API Gateway<br/>REST + Socket.IO]
        QS[Queue Service<br/>iç kuyruk + oylama]
        SW[Spotify Sync Worker<br/>tek worker / mekan]
        CS[Chat Service<br/>odalar + moderasyon]
        AS[Auth Service<br/>misafir JWT + mekan OAuth]
    end

    subgraph Veri["💾 Veri Katmanı"]
        PG[(PostgreSQL<br/>kalıcı veri)]
        RD[(Redis<br/>cache, pub/sub,<br/>rate limit, canlı oylar)]
    end

    subgraph Spotify["🎵 Spotify"]
        SAPI[Web API]
        DEV[Spotify Connect Cihazı<br/>mekan hoparlörü]
    end

    Musteri <-->|WSS + HTTPS| GW
    GW --> QS & CS & AS
    QS <--> RD
    QS --> PG
    CS <--> RD
    CS --> PG
    SW -->|POST /me/player/queue| SAPI
    SW <--> RD
    GW -->|arama proxy + cache| SAPI
    SAPI --> DEV

    subgraph Panel["🖥️ Mekan Paneli (React)"]
        P1[Kuyruk Yönetimi / Veto]
        P2[Now Playing + Web Playback SDK]
        P3[Moderasyon]
    end
    Panel <-->|WSS + HTTPS| GW
```

## 2. Bileşenler

### 2.1 API Gateway (NestJS)
- REST: arama, istek oluşturma, oturum yönetimi
- Socket.IO Gateway: kuyruk güncellemeleri, oy sayaçları, sohbet — Redis adapter ile yatay ölçek
- Guard'lar: misafir JWT, mekan-admin JWT, rate limit (Redis token bucket)

### 2.2 Misafir Kimliği (Spotify'sız)
1. Müşteri masadaki QR'ı okutur → `venueId` + `tableId` içeren deep link uygulamayı açar
2. Backend anonim misafir oturumu üretir (takma ad + kısa ömürlü JWT, cihaz kimliğiyle bağlı)
3. Tüm istek/oy/sohbet bu misafir kimliğiyle yapılır

### 2.3 Queue Service (iç kuyruk + oylama)
- İstekler `track_requests` tablosuna yazılır; canlı oy sayaçları Redis sorted set'te (`ZINCRBY`)
- Kurallar: kişi başı aktif istek limiti, aynı şarkı tekrar penceresi (ör. 90 dk), mekan kara listesi, explicit filtresi
- Oylama: 👍 (isteğe bağlı 👎), skor = oy + zaman bonusu (starvation önleme)

### 2.4 Spotify Sync Worker
- Mekan başına tek worker (BullMQ job): çalan şarkı bitmeye ~X sn kala en yüksek skorlu isteği `POST /me/player/queue` ile ekler
- Token yenileme, 429 backoff, cihaz düşmesi tespiti (devices polling) burada
- Spotify'a yazan **tek** bileşen → rate limit ve tutarlılık kontrolü tek noktada

### 2.5 Chat Service
- Odalar: `venue:{id}:general`, `venue:{id}:table:{n}`
- Redis pub/sub ile fan-out, mesajlar PostgreSQL'de (TTL/temizlik politikası)
- Moderasyon: küfür filtresi (TR+EN kelime listesi), kullanıcı raporlama, mekan panelinden susturma/engelleme, mesaj hızı limiti

### 2.6 Mekan Paneli
- Spotify OAuth bağlama akışı (bir kere)
- Kuyruk görüntüleme, veto, öne alma; sohbet moderasyonu; QR kod üretimi
- İsteğe bağlı: Web Playback SDK ile panelin kendisi çalar cihaz olur

## 3. Kritik Akış — Şarkı İsteği

```mermaid
sequenceDiagram
    participant M as Müşteri App
    participant API as NestJS API
    participant R as Redis
    participant W as Sync Worker
    participant S as Spotify API

    M->>API: GET /search?q=... (misafir JWT)
    API->>R: cache kontrol
    alt cache miss
        API->>S: GET /search (mekan token'ı)
        API->>R: sonucu cache'le (5 dk)
    end
    API-->>M: şarkı listesi
    M->>API: POST /requests {trackUri}
    API->>R: ZADD kuyruk skoru
    API-->>M: 201 + WS broadcast "queue:updated"
    Note over W: şarkı bitmeye 20 sn kala
    W->>R: ZPOPMAX en yüksek skor
    W->>S: POST /me/player/queue
    W-->>M: WS "track:queued" (herkese)
```

## 4. Ölçekleme ve Dayanıklılık

- Stateless API pod'ları + Socket.IO Redis adapter → yatay ölçek
- Spotify çağrıları mekan başına serileştirilir (BullMQ concurrency=1)
- Spotify erişilemezse: iç kuyruk çalışmaya devam eder, worker retry/backoff uygular
- Gözlemlenebilirlik: yapılandırılmış log (pino), health check, Sentry

## 5. Güvenlik

- Misafir JWT kısa ömürlü (oturum mekandan ayrılınca ölür), venue-scoped
- Spotify refresh token'ları şifreli saklanır (at-rest encryption)
- CORS, helmet, giriş doğrulama (class-validator), WS handshake doğrulaması
- Kişisel veri minimum: misafirlerden e-posta/telefon istenmez (KVKK dostu)
