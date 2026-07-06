import { Inject, Injectable } from '@nestjs/common';
import type { QueueItemPayload } from '@venuetunes/shared';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';

const key = (sessionId: string) => `session:${sessionId}:queue`;

/**
 * İç kuyruk skorlaması — canlı skorlar Redis sorted set'te.
 * Skor = oy toplamı. Eşitlikte eski istek önce gelir (ZADD sonrası
 * ZPOPMAX aynı skorda lexicographic davranır; requestId uuid olduğu
 * için pratik eşitlik bozma amacıyla DB createdAt'e bakılır).
 */
@Injectable()
export class QueueScoreService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async add(sessionId: string, requestId: string, initialScore: number) {
    await this.redis.zadd(key(sessionId), initialScore, requestId);
  }

  async incr(sessionId: string, requestId: string, by: number): Promise<number> {
    const score = await this.redis.zincrby(key(sessionId), by, requestId);
    return parseFloat(score);
  }

  async remove(sessionId: string, requestId: string) {
    await this.redis.zrem(key(sessionId), requestId);
  }

  /** En yüksek skorlu bekleyen isteği atomik olarak çek */
  async popTop(sessionId: string): Promise<{ requestId: string; score: number } | null> {
    const res = await this.redis.zpopmax(key(sessionId));
    if (!res || res.length < 2) return null;
    return { requestId: res[0], score: parseFloat(res[1]) };
  }

  /** Canlı kuyruğu istemcilere gidecek formatta topla (skor sırasına göre) */
  async snapshot(sessionId: string): Promise<QueueItemPayload[]> {
    const entries = await this.redis.zrevrange(key(sessionId), 0, 49, 'WITHSCORES');
    if (entries.length === 0) return [];

    const ids: string[] = [];
    const scores = new Map<string, number>();
    for (let i = 0; i < entries.length; i += 2) {
      ids.push(entries[i]);
      scores.set(entries[i], parseFloat(entries[i + 1]));
    }

    const requests = await this.prisma.trackRequest.findMany({
      where: { id: { in: ids } },
      include: { guest: { select: { nickname: true } } },
    });
    const byId = new Map(requests.map((r) => [r.id, r]));

    return ids
      .map((id) => {
        const r = byId.get(id);
        if (!r) return null;
        return {
          requestId: r.id,
          trackUri: r.spotifyTrackUri,
          trackName: r.trackName,
          artistName: r.artistName,
          albumArtUrl: r.albumArtUrl,
          durationMs: r.durationMs,
          score: scores.get(id) ?? 0,
          requestedBy: r.guest.nickname,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  async clear(sessionId: string) {
    await this.redis.del(key(sessionId));
  }
}
