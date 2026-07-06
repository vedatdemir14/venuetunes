import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { QueueScoreService } from '../queue/queue-score.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [SpotifyModule, RealtimeModule],
  controllers: [RequestsController],
  providers: [RequestsService, QueueScoreService],
  exports: [RequestsService],
})
export class RequestsModule {}
