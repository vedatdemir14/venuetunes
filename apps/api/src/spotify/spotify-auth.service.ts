import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { encryptSecret } from './crypto.util';

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

/** Mekan hesabını bağlamak için gereken izinler */
const SCOPES = [
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
  'streaming',
].join(' ');

interface PendingAuth {
  venueId: string;
  codeVerifier: string;
  createdAt: number;
}

@Injectable()
export class SpotifyAuthService {
  /** state → PKCE verifier (10 dk TTL, tek instance için yeterli; Faz 1'de Redis'e taşınacak) */
  private readonly pending = new Map<string, PendingAuth>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** 1. Adım: mekan sahibini Spotify onay ekranına yönlendirecek URL'i üret */
  async buildAuthorizeUrl(venueId: string): Promise<string> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Mekan bulunamadı');

    const codeVerifier = randomBytes(64).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const state = randomBytes(16).toString('base64url');

    this.cleanupExpired();
    this.pending.set(state, { venueId, codeVerifier, createdAt: Date.now() });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.getOrThrow<string>('spotify.clientId'),
      redirect_uri: this.config.getOrThrow<string>('spotify.redirectUri'),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state,
      scope: SCOPES,
    });

    return `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`;
  }

  /** 2. Adım: callback — code'u token'a çevir, refresh token'ı şifreli sakla */
  async handleCallback(state: string, code: string) {
    const auth = this.pending.get(state);
    if (!auth) throw new BadRequestException('Geçersiz veya süresi dolmuş state');
    this.pending.delete(state);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.getOrThrow<string>('spotify.redirectUri'),
      client_id: this.config.getOrThrow<string>('spotify.clientId'),
      code_verifier: auth.codeVerifier,
    });

    const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      throw new BadRequestException(`Spotify token değişimi başarısız: ${await res.text()}`);
    }
    const tokens = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Bağlanan Spotify hesabının kimliğini al
    const meRes = await fetch(`${SPOTIFY_API}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meRes.ok) throw new BadRequestException('Spotify profil bilgisi alınamadı');
    const me = (await meRes.json()) as { id: string };

    const key = this.config.getOrThrow<string>('tokenEncryptionKey');
    await this.prisma.spotifyConnection.upsert({
      where: { venueId: auth.venueId },
      create: {
        venueId: auth.venueId,
        refreshTokenEnc: encryptSecret(tokens.refresh_token, key),
        spotifyUserId: me.id,
      },
      update: {
        refreshTokenEnc: encryptSecret(tokens.refresh_token, key),
        spotifyUserId: me.id,
      },
    });

    return { venueId: auth.venueId, spotifyUserId: me.id };
  }

  private cleanupExpired() {
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, auth] of this.pending) {
      if (auth.createdAt < tenMinAgo) this.pending.delete(state);
    }
  }
}
