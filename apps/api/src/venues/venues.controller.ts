import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateTablesDto } from './dto/create-tables.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Post()
  create(@Body() dto: CreateVenueDto) {
    return this.venues.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const venue = await this.venues.findById(id);
    if (!venue) throw new NotFoundException('Mekan bulunamadı');
    return venue;
  }

  /** Masa QR token'ları üret (Faz 4'te admin guard + gerçek QR görseli) */
  @Post(':id/tables')
  createTables(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateTablesDto) {
    return this.venues.createTables(id, dto.count);
  }
}
