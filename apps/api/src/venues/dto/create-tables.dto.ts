import { IsInt, Max, Min } from 'class-validator';

export class CreateTablesDto {
  @IsInt()
  @Min(1)
  @Max(200)
  count: number;
}
