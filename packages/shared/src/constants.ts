/** Mekan başına varsayılan kurallar — venue.settings ile ezilebilir */
export const DEFAULT_VENUE_SETTINGS = {
  maxActiveRequestsPerGuest: 2,
  repeatWindowMinutes: 90,
  explicitFilter: true,
  voteMode: 'up_only' as 'up_only' | 'up_down',
  autoQueueThresholdSec: 20,
} as const;

/** Spotify Şubat 2026 kısıtı: arama isteği başına maks. sonuç */
export const SPOTIFY_SEARCH_MAX_LIMIT = 10;

/** Arama cache TTL (sn) */
export const SEARCH_CACHE_TTL_SEC = 300;

export const ERROR_CODES = {
  GUEST_REQUEST_LIMIT: 'GUEST_REQUEST_LIMIT',
  TRACK_RECENTLY_PLAYED: 'TRACK_RECENTLY_PLAYED',
  TRACK_BLACKLISTED: 'TRACK_BLACKLISTED',
  EXPLICIT_BLOCKED: 'EXPLICIT_BLOCKED',
  ALREADY_VOTED: 'ALREADY_VOTED',
  SESSION_CLOSED: 'SESSION_CLOSED',
  SPOTIFY_UNAVAILABLE: 'SPOTIFY_UNAVAILABLE',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
