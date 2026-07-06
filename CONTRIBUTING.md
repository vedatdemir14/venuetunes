# Katkı Rehberi

## Branch Stratejisi

- `main` — her zaman deploy edilebilir, korumalı
- `feat/<konu>` — yeni özellik (ör. `feat/queue-voting`)
- `fix/<konu>` — hata düzeltme
- `docs/<konu>` — dokümantasyon

## Commit Mesajları — Conventional Commits

```
feat(queue): oylama skorlamasına zaman bonusu eklendi
fix(chat): masa odasına yanlış katılım düzeltildi
docs(api): auth akışı dokümante edildi
```

Tipler: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

## PR Süreci

1. Issue aç veya mevcut issue'yu üstlen
2. Branch aç, küçük ve odaklı PR gönder
3. CI yeşil olmalı (lint + test + build)
4. En az 1 review sonrası squash merge

## Kod Standartları

- TypeScript strict mode, `any` yasak (zorunluysa gerekçeli)
- ESLint + Prettier (CI'da zorunlu)
- API değişikliği = `packages/shared` şeması + test güncellemesi
- Gizli bilgiler asla commit'lenmez (`.env.example` kullan)
