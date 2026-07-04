import { Controller, Get, Param, ParseUUIDPipe, Query, Redirect } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';

@Controller('spotify')
export class SpotifyAuthController {
  constructor(private readonly auth: SpotifyAuthService) {}

  /** Mekan sahibi bu URL'e gider → Spotify onay ekranına yönlenir */
  @Get('connect/:venueId')
  @Redirect()
  async connect(@Param('venueId', ParseUUIDPipe) venueId: string) {
    const url = await this.auth.buildAuthorizeUrl(venueId);
    return { url, statusCode: 302 };
  }

  /** Spotify buraya geri döner */
  @Get('callback')
  async callback(@Query('state') state: string, @Query('code') code?: string, @Query('error') error?: string) {
    if (error || !code) {
      return { ok: false, error: error ?? 'code eksik' };
    }
    const result = await this.auth.handleCallback(state, code);
    return { ok: true, message: 'Spotify hesabı bağlandı 🎵', ...result };
  }
}
