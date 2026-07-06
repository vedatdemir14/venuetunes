import { Inject, Injectable } from '@nestjs/common';
import { SEARCH_CACHE_TTL_SEC, TrackResult } from '@venuetunes/shared';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { SpotifyClientService } from '../spotify/spotify-client.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly spotify: SpotifyClientService,
  ) {}

  /** Spotify arama — Redis cache'li (rate limit koruması) */
  async search(venueId: string, query: string, offset = 0): Promise<TrackResult[]> {
    const normalized = query.trim().toLowerCase();
    const key = `search:${createHash('sha1').update(`${normalized}:${offset}`).digest('hex')}`;

    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as TrackResult[];

    const results = await this.spotify.search(venueId, normalized, offset);
    await this.redis.set(key, JSON.stringify(results), 'EX', SEARCH_CACHE_TTL_SEC);
    return results;
  }
}
