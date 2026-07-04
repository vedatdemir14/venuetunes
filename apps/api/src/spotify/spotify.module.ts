import { Module } from '@nestjs/common';
import { SpotifyAuthController } from './spotify-auth.controller';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyTokenService } from './spotify-token.service';

@Module({
  controllers: [SpotifyAuthController],
  providers: [SpotifyAuthService, SpotifyTokenService],
  exports: [SpotifyTokenService],
})
export class SpotifyModule {}
