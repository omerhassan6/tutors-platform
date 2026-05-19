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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List all classes for the authenticated tutor' })
  findAll(@CurrentUser() user: any) {
    return this.classesService.findAll(user.sub);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled classes' })
  getUpcoming(@CurrentUser() user: any) {
    return this.classesService.getUpcoming(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a class by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.classesService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a new class' })
  create(@CurrentUser() user: any, @Body() dto: CreateClassDto) {
    return this.classesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a class' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.classesService.remove(id, user.sub);
  }
}
