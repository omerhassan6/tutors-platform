import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all exams for the authenticated tutor' })
  findAll(@CurrentUser() user: any) {
    return this.examsService.findAll(user.sub);
  }

  @Get('students/:id/results')
  @ApiOperation({ summary: 'Get all exam results for a specific student' })
  getStudentResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.getStudentResults(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exam by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.examsService.findOne(id, user.sub);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get all results for a specific exam' })
  getResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.getResults(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  create(@CurrentUser() user: any, @Body() dto: CreateExamDto) {
    return this.examsService.create(user.sub, dto);
  }

  @Post('results')
  @ApiOperation({ summary: 'Submit exam result for a student' })
  submitResult(@CurrentUser() user: any, @Body() dto: SubmitResultDto) {
    return this.examsService.submitResult(user.sub, dto);
  }
}
