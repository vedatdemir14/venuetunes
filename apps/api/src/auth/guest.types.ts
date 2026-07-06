export interface GuestTokenPayload {
  sub: string; // guestId
  sessionId: string;
  venueId: string;
  nickname: string;
  tableNo: number | null;
  kind: 'guest';
}
