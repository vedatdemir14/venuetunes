import { IsIn, IsString, Matches } from 'class-validator';

export class CreateRequestDto {
  /** Spotify track ID (22 karakter base62) */
  @IsString()
  @Matches(/^[0-9A-Za-z]{22}$/, { message: 'geçersiz Spotify track id' })
  trackId: string;
}

export class CastVoteDto {
  @IsIn([1, -1])
  value: 1 | -1;
}
