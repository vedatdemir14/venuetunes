import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_VENUE_SETTINGS } from '@venuetunes/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVenueDto) {
    const existing = await this.prisma.venue.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Bu slug zaten kullanımda');

    return this.prisma.venue.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        settings: { ...DEFAULT_VENUE_SETTINGS },
      },
    });
  }

  /** 1..count arası masalar için QR token üret (mevcutları korur) */
  async createTables(venueId: string, count: number) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Mekan bulunamadı');

    const tables = [];
    for (let tableNo = 1; tableNo <= count; tableNo++) {
      tables.push(
        await this.prisma.tableQr.upsert({
          where: { venueId_tableNo: { venueId, tableNo } },
          create: { venueId, tableNo, qrToken: randomBytes(16).toString('base64url') },
          update: {},
        }),
      );
    }
    return tables;
  }

  findById(id: string) {
    return this.prisma.venue.findUnique({
      where: { id },
      include: { spotifyConnection: { select: { spotifyUserId: true, connectedAt: true } } },
    });
  }
}
