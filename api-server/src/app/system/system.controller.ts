import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('system')
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let dbStatus = 'connected';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = 'disconnected';
      dbLatencyMs = -1;
    }

    const mem = process.memoryUsage();
    const uptime = Math.floor(process.uptime());

    const isHealthy = dbStatus === 'connected';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        engine: 'PostgreSQL',
      },
      memory: {
        status: 'healthy',
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
      process: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    };
  }

  @Get('context')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  getContext(@Req() request: any) {
    // Return only the trusted OrganizationContext attached by the guard
    return request.organizationContext;
  }
}
