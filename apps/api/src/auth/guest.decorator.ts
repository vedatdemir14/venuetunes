import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GuestTokenPayload } from './guest.types';

/** Controller parametresinde doğrulanmış misafiri verir: `@Guest() guest` */
export const Guest = createParamDecorator((_: unknown, ctx: ExecutionContext): GuestTokenPayload => {
  const req = ctx.switchToHttp().getRequest();
  return req.guest as GuestTokenPayload;
});
