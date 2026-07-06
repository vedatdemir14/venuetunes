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
import { JoinSessionDto } from './dto/sessions.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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

  async close(sessionId: string) {
    return this.prisma.venueSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
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
      where: { sessionId_deviceHash: { sessionId: session.id, deviceHash } },
      create: {
        sessionId: session.id,
        nickname: dto.nickname,
        deviceHash,
        tableNo: qr.tableNo,
      },
      update: { nickname: dto.nickname, tableNo: qr.tableNo },
    });

    if (guest.status === 'BANNED') throw new ForbiddenException('Bu oturuma erişimin engellendi');

    const payload: GuestTokenPayload = {
      sub: guest.id,
      sessionId: session.id,
      venueId: qr.venueId,
      nickname: guest.nickname,
      tableNo: guest.tableNo,
      kind: 'guest',
    };

    return {
      token: await this.jwt.signAsync(payload),
      guest: { id: guest.id, nickname: guest.nickname, tableNo: guest.tableNo },
      session: { id: session.id, venueName: qr.venue.name },
    };
  }
}
