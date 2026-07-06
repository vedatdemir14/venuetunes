import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GuestAuthGuard } from '../auth/guest-auth.guard';
import { Guest } from '../auth/guest.decorator';
import { GuestTokenPayload } from '../auth/guest.types';
import { CastVoteDto, CreateRequestDto } from './dto/requests.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
@UseGuards(GuestAuthGuard)
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  create(@Guest() guest: GuestTokenPayload, @Body() dto: CreateRequestDto) {
    return this.requests.create(guest, dto.trackId);
  }

  @Post(':id/vote')
  vote(
    @Guest() guest: GuestTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CastVoteDto,
  ) {
    return this.requests.vote(guest, id, dto.value);
  }

  @Get('queue')
  queue(@Guest() guest: GuestTokenPayload) {
    return this.requests.getQueue(guest.sessionId);
  }
}
