import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({ summary: 'Mark attendance for a single student' })
  markAttendance(@CurrentUser() user: any, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.markAttendance(user.sub, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Mark attendance for multiple students at once' })
  markBulkAttendance(@CurrentUser() user: any, @Body() dto: BulkAttendanceDto) {
    return this.attendanceService.markBulkAttendance(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Query attendance records' })
  findAll(@CurrentUser() user: any, @Query() query: QueryAttendanceDto) {
    if (query.batchId) {
      return this.attendanceService.findByBatch(user.sub, query);
    }
    return this.attendanceService.findByStudent(user.sub, query);
  }

  @Get('report/monthly')
  @ApiOperation({ summary: 'Get monthly attendance report for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getMonthlyReport(
    @Query('studentId', ParseUUIDPipe) studentId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.attendanceService.getMonthlyReport(studentId, month, year);
  }
}
