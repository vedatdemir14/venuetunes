import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { GuestTokenPayload } from './guest.types';

@Injectable()
export class GuestAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { guest?: GuestTokenPayload }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Misafir token gerekli');
    }
    try {
      const payload = await this.jwt.verifyAsync<GuestTokenPayload>(header.slice(7));
      if (payload.kind !== 'guest') throw new Error('yanlış token türü');
      req.guest = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }
  }
}
