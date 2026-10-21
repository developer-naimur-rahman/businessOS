import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export interface RateLimitOptions {
  limit: number;
  ttlSeconds: number;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface RateRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static store = new Map<string, RateRecord>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';
    const handlerName = context.getHandler().name;
    const key = `${clientIp}:${handlerName}`;

    const now = Date.now();
    const record = RateLimitGuard.store.get(key);

    if (!record || now > record.resetTime) {
      RateLimitGuard.store.set(key, {
        count: 1,
        resetTime: now + options.ttlSeconds * 1000,
      });
      return true;
    }

    if (record.count >= options.limit) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please wait ${waitSeconds} second(s) before trying again.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
    return true;
  }
}
