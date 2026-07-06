import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_VENUE_SETTINGS, ERROR_CODES, VenueSettings } from '@venuetunes/shared';
import { GuestTokenPayload } from '../auth/guest.types';
import { PrismaService } from '../prisma/prisma.service';
import { QueueScoreService } from '../queue/queue-score.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SpotifyClientService } from '../spotify/spotify-client.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyClientService,
    private readonly scores: QueueScoreService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async getSettings(venueId: string): Promise<VenueSettings> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    return { ...DEFAULT_VENUE_SETTINGS, ...((venue?.settings as object) ?? {}) } as VenueSettings;
  }

  /** Şarkı isteği oluştur — tüm mekan kuralları burada uygulanır */
  async create(guest: GuestTokenPayload, trackId: string) {
    const session = await this.prisma.venueSession.findUnique({
      where: { id: guest.sessionId },
    });
    if (!session || session.status !== 'ACTIVE') {
      throw new ConflictException({ code: ERROR_CODES.SESSION_CLOSED, message: 'Oturum kapalı' });
    }

    const settings = await this.getSettings(guest.venueId);

    // Kural 1: kişi başı aktif istek limiti
    const activeCount = await this.prisma.trackRequest.count({
      where: { guestId: guest.sub, status: 'PENDING' },
    });
    if (activeCount >= settings.maxActiveRequestsPerGuest) {
      throw new ForbiddenException({
        code: ERROR_CODES.GUEST_REQUEST_LIMIT,
        message: `Aynı anda en fazla ${settings.maxActiveRequestsPerGuest} bekleyen isteğin olabilir`,
      });
    }

    // Şarkı bilgisini Spotify'dan doğrula (istemciye güvenme)
    const track = await this.spotify.getTrack(guest.venueId, trackId);

    // Kural 2: explicit filtresi
    if (settings.explicitFilter && track.explicit) {
      throw new ForbiddenException({
        code: ERROR_CODES.EXPLICIT_BLOCKED,
        message: 'Bu mekanda explicit şarkılar kapalı',
      });
    }

    // Kural 3: kara liste
    if (settings.blacklistedTrackUris?.includes(track.uri)) {
      throw new ForbiddenException({
        code: ERROR_CODES.TRACK_BLACKLISTED,
        message: 'Bu şarkı mekan tarafından engellenmiş',
      });
    }

    // Kural 4: tekrar penceresi — aynı şarkı yakın zamanda istendi/çalındı mı
    const windowStart = new Date(Date.now() - settings.repeatWindowMinutes * 60_000);
    const recent = await this.prisma.trackRequest.findFirst({
      where: {
        sessionId: guest.sessionId,
        spotifyTrackUri: track.uri,
        OR: [
          { status: 'PENDING' },
          { status: { in: ['QUEUED', 'PLAYED'] }, createdAt: { gte: windowStart } },
        ],
      },
    });
    if (recent) {
      throw new ConflictException({
        code: ERROR_CODES.TRACK_RECENTLY_PLAYED,
        message: 'Bu şarkı zaten kuyrukta veya yakın zamanda çalındı',
      });
    }

    const request = await this.prisma.trackRequest.create({
      data: {
        sessionId: guest.sessionId,
        guestId: guest.sub,
        spotifyTrackUri: track.uri,
        trackName: track.name,
        artistName: track.artists,
        albumArtUrl: track.albumArtUrl,
        durationMs: track.durationMs,
      },
    });

    // İsteyen otomatik +1 oy verir
    await this.prisma.vote.create({
      data: { requestId: request.id, guestId: guest.sub, value: 1 },
    });
    await this.scores.add(guest.sessionId, request.id, 1);

    await this.broadcastQueue(guest.sessionId);
    return request;
  }

  /** Oy ver */
  async vote(guest: GuestTokenPayload, requestId: string, value: 1 | -1) {
    const settings = await this.getSettings(guest.venueId);
    if (value === -1 && settings.voteMode === 'up_only') {
      throw new BadRequestException('Bu mekanda sadece olumlu oy verilebilir');
    }

    const request = await this.prisma.trackRequest.findUnique({ where: { id: requestId } });
    if (!request || request.sessionId !== guest.sessionId) {
      throw new NotFoundException('İstek bulunamadı');
    }
    if (request.status !== 'PENDING') {
      throw new ConflictException('Bu istek artık oylanamaz');
    }

    try {
      await this.prisma.vote.create({
        data: { requestId, guestId: guest.sub, value },
      });
    } catch {
      // unique constraint (requestId, guestId)
      throw new ConflictException({
        code: ERROR_CODES.ALREADY_VOTED,
        message: 'Bu isteğe zaten oy verdin',
      });
    }

    const newScore = await this.scores.incr(guest.sessionId, requestId, value);
    await this.broadcastQueue(guest.sessionId);
    return { requestId, score: newScore };
  }

  /** Canlı kuyruğu getir (REST — ilk yükleme için; sonrası WS'ten akar) */
  getQueue(sessionId: string) {
    return this.scores.snapshot(sessionId);
  }

  async broadcastQueue(sessionId: string) {
    const queue = await this.scores.snapshot(sessionId);
    this.realtime.emitQueueUpdated(sessionId, queue);
  }
}
