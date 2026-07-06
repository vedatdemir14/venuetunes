import { BullModule } from '@nestjs/bullmq';
import { Module, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { RealtimeModule } from '../realtime/realtime.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { QueueScoreService } from './queue-score.service';
import { SyncProcessor } from './sync.processor';

export const SYNC_QUEUE = 'spotify-sync';
/** Aktif oturumları bu aralıkla tara (ms) */
const SYNC_INTERVAL_MS = 5000;

@Module({
  imports: [
    BullModule.registerQueue({ name: SYNC_QUEUE }),
    SpotifyModule,
    RealtimeModule,
  ],
  providers: [QueueScoreService, SyncProcessor],
  exports: [QueueScoreService],
})
export class QueueModule implements OnModuleInit {
  constructor(@InjectQueue(SYNC_QUEUE) private readonly queue: Queue) {}

  /** Tek tekrarlı iş: tüm aktif oturumları periyodik senkronize et */
  async onModuleInit() {
    await this.queue.upsertJobScheduler('venue-sync-scheduler', {
      every: SYNC_INTERVAL_MS,
    });
  }
}
