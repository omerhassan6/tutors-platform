import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all assignments for the authenticated tutor' })
  findAll(@CurrentUser() user: any) {
    return this.assignmentsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an assignment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.assignmentsService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new assignment' })
  create(@CurrentUser() user: any, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an assignment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an assignment' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.assignmentsService.remove(id, user.sub);
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Submit an assignment' })
  createSubmission(@CurrentUser() user: any, @Body() dto: CreateSubmissionDto) {
    return this.assignmentsService.createSubmission(user.sub, dto);
  }

  @Patch('submissions/:id/grade')
  @ApiOperation({ summary: 'Grade a submission' })
  gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(id, user.sub, dto);
  }
}
