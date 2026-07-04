import { ConflictException, Injectable } from '@nestjs/common';
import { DEFAULT_VENUE_SETTINGS } from '@venuetunes/shared';
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

  findById(id: string) {
    return this.prisma.venue.findUnique({
      where: { id },
      include: { spotifyConnection: { select: { spotifyUserId: true, connectedAt: true } } },
    });
  }
}
