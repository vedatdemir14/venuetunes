import { Module } from '@nestjs/common';
import { SpotifyAuthController } from './spotify-auth.controller';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyClientService } from './spotify-client.service';
import { SpotifyTokenService } from './spotify-token.service';

@Module({
  controllers: [SpotifyAuthController],
  providers: [SpotifyAuthService, SpotifyTokenService, Spo