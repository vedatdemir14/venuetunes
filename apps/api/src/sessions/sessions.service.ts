import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { GuestTokenPayload } from '../auth/guest.types';
import { PrismaService } from '../prisma/prisma.service';
import { QueueScoreService } from '../queue/queue-score.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { JoinSessionDto } from './dto/sessions.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly scores: QueueScoreService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** Mekan için aktif oturum aç (Faz 4'te admin guard eklenecek) */
  async open(venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Mekan bulunamadı');

    const existing = await this.prisma.venueSession.findFirst({
      where: { venueId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('Bu mekanda zaten aktif oturum var');

    return this.prisma.venueSession.create({ data: { venueId } });
  }

  /** Oturumu kapat: bekleyen istekleri düşür, canlı kuyruğu temizle, misafirleri bilgilendir */
  async close(sessionId: string) {
    const session = await this.prisma.venueSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Oturum bulunamadı');
    if (session.status === 'CLOSED') return session;

    const closed = await this.prisma.venueSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    await this.prisma.trackRequest.updateMany({
      where: { sessionId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });
    await this.scores.clear(sessionId);
    await this.realtime.emitSessionClosed(sessionId);

    return closed;
  }

  /** QR token ile misafir katılımı → misafir JWT döner */
  async join(dto: JoinSessionDto) {
    const qr = await this.prisma.tableQr.findUnique({
      where: { qrToken: dto.qrToken },
      include: { venue: true },
    });
    if (!qr) throw new NotFoundException('Geçersiz QR kodu');

    const session = await this.prisma.venueSession.findFirst({
      where: { venueId: qr.venueId, status: 'ACTIVE' },
    });
    if (!session) throw new NotFoundException('Mekanda aktif oturum yok');

    const deviceHash = createHash('sha256').update(dto.deviceId).digest('hex').slice(0, 32);

    const guest = await this.prisma.guest.upsert({
  