import { IsString, Length, Matches } from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsString()
  @Length(2, 40)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug sadece küçük harf, rakam ve tire içerebilir' })
  slug: string;
}
