import type { QueueItemPayload, TrackResult } from '@venuetunes/shared';
import { getDeviceId } from './device';
import { useAppStore } from './store';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, token } = useAppStore.getState();
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (typeof body?.message === 'string' ? body.message : body?.message?.message) ??
      `İstek başarısız (${res.status})`;
    throw new ApiError(res.status, msg, body?.message?.code ?? body?.code);
  }
  return body as T;
}

export interface JoinResponse {
  token: string;
  guest: { id: string; nickname: string; tableNo: number | null };
  session: { id: string; venueName: string };
}

export const api = {
  join(qrToken: string, nickname: string) {
    return getDeviceId().then((deviceId) =>
      request<JoinResponse>('/sessions/join', {
        method: 'POST',
        body: JSON.stringify({ qrToken, nickname, deviceId }),
      }),
    );
  },

  search(q: string, offset = 0) {
    return request<TrackResult[]>(`/search?q=${encodeURIComponent(q)}&offset=${offset}`);
  },

  createRequest(trackId: string) {
    return request<{ id: string }>('/requests', {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  },

  vote(requestId: string, value: 1 | -1 = 1) {
    return request<{ requestId: string; score: number }>(`/requests/${requestId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },

  getQueue() {
    return request<QueueItemPayload[]>('/requests/queue');
  },
};
