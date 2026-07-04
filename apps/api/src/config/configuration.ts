export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  spotify: {
    clientId: string;
    redirectUri: string;
  };
  tokenEncryptionKey: string;
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? '',
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID ?? '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:3000/spotify/callback',
  },
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? '',
});

/** Uygulama açılışında zorunlu env kontrolü — eksikse anlaşılır hata ver */
export function validateEnv(env: Record<string, unknown>) {
  const required = ['DATABASE_URL', 'SPOTIFY_CLIENT_ID', 'TOKEN_ENCRYPTION_KEY', 'JWT_SECRET'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(`Eksik ortam değişkenleri: ${missing.join(', ')} (.env dosyanı kontrol et)`);
  }
  const key = String(env.TOKEN_ENCRYPTION_KEY);
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('TOKEN_ENCRYPTION_KEY 64 karakterlik hex olmalı (32 byte)');
  }
  return env;
}
