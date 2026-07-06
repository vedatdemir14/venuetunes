import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { JoinSessionDto, OpenSessionDto } from './dto/sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  open(@Body() dto: OpenSessionDto) {
    return this.sessions.open(dto.venueId);
  }

  @Post(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.close(id);
  }

  @Post('join')
  join(@Body() dto: JoinSessionDto) {
    return this.sessions.join(dto);
  }
}
