import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuestAuthGuard } from '../auth/guest-auth.guard';
import { Guest } from '../auth/guest.decorator';
import { GuestTokenPayload } from '../auth/guest.types';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(GuestAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  async find(
    @Guest() guest: GuestTokenPayload,
    @Query('q') q?: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
  ) {
    if (!q || q.trim().length < 2) throw new BadRequestException('En az 2 karakter gir');
    return this.search.search(guest.venueId, q, Math.max(0, offset));
  }
}
