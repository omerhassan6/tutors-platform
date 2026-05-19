import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics for the authenticated tutor' })
  getDashboardStats(@CurrentUser() user: any) {
    return this.analyticsService.getDashboardStats(user.sub);
  }

  @Get('students/:id/progress')
  @ApiOperation({ summary: 'Get progress report for a specific student' })
  getStudentProgress(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.analyticsService.getStudentProgress(id, user.sub);
  }

  @Get('batches/:id/performance')
  @ApiOperation({ summary: 'Get performance summary for a batch' })
  getBatchPerformance(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.analyticsService.getBatchPerformance(id, user.sub);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics for the authenticated tutor' })
  getRevenueAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getRevenueAnalytics(user.sub);
  }
}
