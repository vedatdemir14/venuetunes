import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { DEFAULT_VENUE_SETTINGS, VenueSettings } from '@venuetunes/shared';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  NowPlaying,
  SpotifyClientService,
  SpotifyRateLimitError,
} from '../spotify/spotify-client.service';
import { QueueScoreService } from './queue-score.service';
import { SYNC_QUEUE } from './queue.constants';

/**
 * Her tikte tüm aktif oturumları senkronize eder:
 * 1. Çalan şarkıyı oku → değiştiyse yayınla, QUEUED → PLAYED geçişini işle
 * 2. Şarkı bitmeye yaklaştıysa en yüksek skorlu isteği Spotify kuyruğuna it
 *
 * Mekan başına ardışık çalışır (tek worker) → rate limit ve tutarlılık tek noktada.
 */
@Processor(SYNC_QUEUE)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);
  /** 429 yediğimiz mekanları bu zamana kadar atla (epoch ms) */
  private readonly backoffUntil = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyClientService,
    private readonly scores: QueueScoreService,
    private readonly realtime: RealtimeGateway,
    @Inject(REDIS) private readonly redis: Redis,
  ) {
    super();
  }

  async process(): Promise<void> {
    const sessions = await this.prisma.venueSession.findMany({
      where: { status: 'ACTIVE', venue: { spotifyConnection: { isNot: null } } },
      include: { venue: true },
    });

    for (const session of sessions) {
      const until = this.backoffUntil.get(session.venueId) ?? 0;
      if (Date.now() < until) continue;

      try {
        await this.syncSession(session.id, session.venueId, session.venue.settings);
      } catch (err) {
        if (err instanceof SpotifyRateLimitError) {
          this.backoffUntil.set(session.venueId, Date.now() + err.retryAfterSec * 1000);
          this.logger.warn(`Rate limit: ${session.venueId} → ${err.retryAfterSec} sn bekleniyor`);
        } else {
          this.logger.error(`Sync hatası (${session.venueId}): ${(err as Error).message}`);
        }
      }
    }
  }

  private async syncSession(sessionId: string, venueId: string, rawSettings: unknown) {
    const settings = { ...DEFAULT_VENUE_SETTINGS, ...((rawSettings as object) ?? {}) } as VenueSettings;
    const np = await this.spotify.getCurrentlyPlaying(venueId);

    // 1) Çalan şarkı değişimini yayınla
    const npKey = `venue:${venueId}:nowplaying`;
    const prevUri = await this.redis.hget(npKey, 'trackUri');
    const prevPlaying = await this.redis.hget(npKey, 'isPlaying');
    const changed = prevUri !== (np.trackUri ?? '') || prevPlaying !== String(np.isPlaying);

    await this.redis.hset(npKey, {
      trackUri: np.trackUri ?? '',
      isPlaying: String(np.isPlaying),
    });

    if (changed) {
      this.realtime.emitNowPlaying(sessionId, np);
      // Kuyruğa ittiğimiz şarkı çalmaya başladıysa → PLAYED
      if (np.trackUri) {
        const updated = await this.prisma.trackRequest.updateMany({
          where: { sessionId, spotifyTrackUri: np.trackUri, status: 'QUEUED' },
          data: { status: 'PLAYED' },
        });
        if (updated.count > 0) {
          const queue = await this.scores.snapshot(sessionId);
          this.realtime.emitQueueUpdated(sessionId, queue);
        }
      }
    }

    // 2) Şarkı bitmeye yaklaştıysa sıradakini it
    if (!np.isPlaying || !np.trackUri || np.durationMs === 0) return;

    const remainingMs = np.durationMs - np.progressMs;
    if (remainingMs > settings.autoQueueThresholdSec * 1000) return;

    // Bu çalma için zaten ittik mi? (flag TTL'i kalan süre + pay)
    const flagKey = `venue:${venueId}:queuedfor`;
    const alreadyQueuedFor = await this.redis.get(flagKey);
    if (alreadyQueuedFor === np.trackUri) return;

    const top = await this.scores.popTop(sessionId);
    if (!top) return;

    const request = await this.prisma.trackRequest.findUnique({ where: { id: top.requestId } });
    if (!request || request.status !== 'PENDING') return;

    try {
      await this.spotify.addToQueue(venueId, request.spotifyTrackUri);
    } catch (err) {
      // Başarısızsa isteği kuyruğa geri koy
      await this.scores.add(sessionId, top.requestId, top.score);
      throw err;
    }

    await this.redis.set(flagKey, np.trackUri, 'PX', Math.max(remainingMs + 30_000, 60_000));
    await this.prisma.trackRequest.update({
      where: { id: request.id },
      data: { status: 'QUEUED', queuedAt: new Date(), finalScore: Math.round(top.score) },
    });

    const guest = await this.prisma.guest.findUnique({ where: { id: request.guestId } });
    this.realtime.emitTrackQueued(sessionId, {
      requestId: request.id,
      trackUri: request.spotifyTrackUri,
      trackName: request.trackName,
      artistName: request.artistName,
      albumArtUrl: request.albumArtUrl,
      durationMs: request.durationMs,
      score: top.score,
      requestedBy: guest?.nickname ?? '?',
    });
    const queue = await this.scores.snapshot(sessionId);
    this.realtime.emitQueueUpdated(sessionId, queue);

    this.logger.log(`🎵 Kuyruğa eklendi: "${request.trackName}" (skor ${top.score