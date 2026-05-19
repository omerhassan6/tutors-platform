import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    let dbStatus: 'connected' | 'error' = 'connected';

    try {
      const { error } = await this.supabase.client
        .from('students')
        .select('id')
        .limit(1);

      if (error) dbStatus = 'error';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      db: dbStatus,
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }
}
