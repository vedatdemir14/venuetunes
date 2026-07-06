import { HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { SPOTIFY_SEARCH_MAX_LIMIT, TrackResult } from '@venuetunes/shared';
import { SpotifyTokenService } from './spotify-token.service';

const API = 'https://api.spotify.com/v1';

export interface NowPlaying {
  trackUri: string | null;
  trackName: string | null;
  artistName: string | null;
  albumArtUrl: string | null;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}

/** 429 durumunda fırlatılır — worker Retry-After'a göre bekler */
export class SpotifyRateLimitError extends Error {
  constructor(public readonly retryAfterSec: number) {
    super(`Spotify rate limit — ${retryAfterSec} sn bekle`);
  }
}

@Injectable()
export class SpotifyClientService {
  private readonly logger = new Logger(SpotifyClientService.name);

  constructor(private readonly tokens: SpotifyTokenService) {}

  private async call<T>(venueId: string, path: string, init?: RequestInit): Promise<T | null> {
    const token = await this.tokens.getAccessToken(venueId);
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
    });

    if (res.status === 204) return null;
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10);
      throw new SpotifyRateLimitError(retryAfter);
    }
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Spotify ${path} → ${res.status}: ${text}`);
      throw new HttpException(`Spotify hatası (${res.status})`, res.status >= 500 ? 503 : res.status);
    }
    const contentType = res.headers.get('content-type') ?? '';
    return contentType.includes('json') ? ((await res.json()) as T) : null;
  }

  async search(venueId: string, query: string, offset = 0): Promise<TrackResult[]> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: String(SPOTIFY_SEARCH_MAX_LIMIT),
      offset: String(offset),
    });
    const data = await this.call<{ tracks: { items: SpotifyTrack[] } }>(
      venueId,
      `/search?${params}`,
    );
    return (data?.tracks.items ?? []).map(mapTrack);
  }

  async getTrack(venueId: string, trackId: string): Promise<TrackResult> {
    const data = await this.call<SpotifyTrack>(venueId, `/tracks/${trackId}`);
    if (!data) throw new ServiceUnavailableException('Şarkı bilgisi alınamadı');
    return mapTrack(data);
  }

  async getCurrentlyPlaying(venueId: string): Promise<NowPlaying> {
    const data = await this.call<SpotifyCurrentlyPlaying>(venueId, '/me/player/currently-playing');
    if (!data?.item) {
      return {
        trackUri: null,
        trackName: null,
        artistName: null,
        albumArtUrl: null,
        progressMs: 0,
        durationMs: 0,
        isPlaying: false,
      };
    }
    return {
      trackUri: data.item.uri,
      trackName: data.item.name,
      artistName: data.item.artists.map((a) => a.name).join(', '),
      albumArtUrl: data.item.album?.images?.[0]?.url ?? null,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms,
      isPlaying: data.is_playing,
    };
  }

  async addToQueue(venueId: string, trackUri: string): Promise<void> {
    const params = new URLSearchParams({ uri: trackUri });
    await this.call(venueId, `/me/player/queue?${params}`, { method: 'POST' });
  }
}

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  explicit: boolean;
  duration_ms: number;
  artists: { name: string }[];
  album?: { images?: { url: string }[] };
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number | null;
  item: SpotifyTrack | null;
}

function mapTrack(t: SpotifyTrack): TrackResult {
  return {
    id: t.id,
    uri: t.uri,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(', '),
    albumArtUrl: t.album?.images?.[0]?.url ?? null,
    durationMs: t.duration_ms,
    explicit: t.explicit,
  };
}
