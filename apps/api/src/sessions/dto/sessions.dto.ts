import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  venueId: string;
}

export class JoinSessionDto {
  @IsString()
  @Length(8, 64)
  qrToken: string;

  @IsString()
  @Length(2, 24)
  @Matches(/^[\p{L}\p{N} _.-]+$/u, { message: 'takma ad geçersiz karakter içeriyor' })
  nickname: string;

  /** İstemcinin ürettiği kalıcı cihaz kimliği (çoklu oy engeli için) */
  @IsString()
  @Length(8, 128)
  deviceId: string;
}
