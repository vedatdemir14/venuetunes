import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret, encryptSecret } from './crypto.util';

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

/**
 * Mekan başına Spotify access token yönetimi.
 * - Access token bellekte cache'lenir (60 sn güvenlik payı)
 * - Refresh token DB'de şifreli durur; Spotify rotasyon yaparsa güncellenir
 * - Faz 1'de cache Redis'e taşınacak (çoklu instance için)
 */
@Injectable()
export class SpotifyTokenService {
  private readonly cache = new Map<string, CachedToken>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getAccessToken(venueId: string): Promise<string> {
    const cached = this.cache.get(venueId);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.accessToken;
    }
    return this.refresh(venueId);
  }

  private async refresh(venueId: string): Promise<string> {
    const conn = await this.prisma.spotifyConnection.findUnique({ where: { venueId } });
    if (!conn) {
      throw new ServiceUnavailableException('Bu mekan için Spotify bağlantısı yok');
    }

    const key = this.config.getOrThrow<string>('tokenEncryptionKey');
    const refreshToken = decryptSecret(conn.refreshTokenEnc, key);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.getOrThrow<string>('spotify.clientId'),
    });

    const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Spotify token yenileme başarısız (${res.status}) — mekan yeniden bağlanmalı olabilir`,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    // PKCE akışında Spotify refresh token rotasyonu yapabilir
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      await this.prisma.spotifyConnection.update({
        where: { venueId },
        data: { refreshTokenEnc: encryptSecret(data.refresh_token, key) },
      });
    }

    this.cache.set(venueId, {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
  }
}
