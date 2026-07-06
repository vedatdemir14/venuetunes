import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  ChatMessagePayload,
  NowPlayingPayload,
  QueueItemPayload,
} from '@venuetunes/shared';
import { Server, Socket } from 'socket.io';
import { GuestTokenPayload } from '../auth/guest.types';

/**
 * Canlı yayın kanalı. Misafirler JWT ile bağlanır ve otomatik olarak
 * `session:{id}` odasına katılır. Oy/istek yazma işlemleri REST'ten yapılır;
 * bu gateway yalnızca yayın yapar (Faz 3'te chat için çift yönlü olacak).
 */
@WebSocketGateway({ cors: { origin: true }, namespace: '/rt' })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers.authorization?.startsWith('Bearer ')
        ? client.handshake.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<GuestTokenPayload>(token);
      if (payload.kind !== 'guest') throw new Error('yanlış token türü');
      client.data.guest = payload;
      await client.join(`session:${payload.sessionId}`);
    } catch {
      this.logger.debug('WS bağlantısı reddedildi: geçersiz token');
      client.disconnect(true);
    }
  }

  emitQueueUpdated(sessionId: string, queue: QueueItemPayload[]) {
    this.server.to(`session:${sessionId}`).emit('queue:updated', queue);
  }

  emitTrackQueued(sessionId: string, item: QueueItemPayload) {
    this.server.to(`session:${sessionId}`).emit('track:queued', item);
  }

  emitNowPlaying(sessionId: string, state: NowPlayingPayload) {
    this.server.to(`session:${sessionId}`).emit('nowplaying:changed', state);
  }

  emitChatMessage(sessionId: string, msg: ChatMessagePayload) {
    this.server.to(`session:${sessionId}`).emit('chat:message', msg);
  }

  /** Oturum kapandı: bildir ve odadaki tüm bağlantıları düşür */
  async emitSessionClosed(sessionId: string) {
    const room = `session:${sessionId}`;
    this.server.to(room).emit('session:closed');
    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) socket.disconnect(true);
  }
}
