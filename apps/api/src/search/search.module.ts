import { Module } from '@nestjs/common';
import { SpotifyModule } from '../spotify/spotify.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [SpotifyModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
