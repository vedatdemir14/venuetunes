/** Socket.IO event sözleşmesi — sunucu ve istemciler bu tipleri paylaşır */

export interface QueueItemPayload {
  requestId: string;
  trackUri: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string | null;
  durationMs: number;
  score: number;
  requestedBy: string; // takma ad
}

export interface NowPlayingPayload {
  trackUri: string | null;
  trackName: string | null;
  artistName: string | null;
  albumArtUrl: string | null;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}

export interface ChatMessagePayload {
  messageId: string;
  roomId: string;
  nickname: string;
  content: string;
  sentAt: string; // ISO
}

/** server → client */
export interface ServerToClientEvents {
  'queue:updated': (queue: QueueItemPayload[]) => void;
  'track:queued': (item: QueueItemPayload) => void;
  'nowplaying:changed': (state: NowPlayingPayload) => void;
  'chat:message': (msg: ChatMessagePayload) => void;
  'guest:muted': (payload: { until: string | null }) => void;
  'session:closed': () => void;
}

/** client → server */
export interface ClientToServerEvents {
  'vote:cast': (payload: { requestId: string; value: 1 | -1 }) => void;
  'chat:send': (payload: { roomId: string; content: string }) => void;
  'room:join': (payload: { roomId: string }) => void;
  'room:leave': (payload: