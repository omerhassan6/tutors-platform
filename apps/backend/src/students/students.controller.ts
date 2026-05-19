import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all students for the authenticated tutor' })
  findAll(@CurrentUser() user: any, @Query() query: QueryStudentDto) {
    return this.studentsService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.studentsService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  create(@CurrentUser() user: any, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a student' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.studentsService.remove(id, user.sub);
  }
}
