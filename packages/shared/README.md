# packages/shared — Ortak Tipler ve Sözleşmeler

API ve istemciler arasında paylaşılan tek doğruluk kaynağı.

## İçerik (planlanan)

```
src/
├── schemas/     # Zod şemaları (request/response DTO'ları)
├── events.ts    # Socket.IO event isimleri + payload tipleri
├── constants.ts # limitler, hata kodları
└── index.ts
```

## Socket.IO Event Sözleşmesi (taslak)

| Event | Yön | Payload |
|---|---|---|
| `queue:updated` | server→client | güncel kuyruk listesi |
| `track:queued` | server→client | Spotify kuyruğuna giren şarkı |
| `nowplaying:changed` | server→client | çalan şarkı |
| `vote:cast` | client→server | `{ requestId, value }` |
| `chat:message` | çift yönlü | `{ roomId, content }` |
| `guest:muted` | server→client | moderasyon bildirimi |
