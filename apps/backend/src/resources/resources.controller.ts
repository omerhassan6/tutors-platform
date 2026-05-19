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
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all resources for the authenticated tutor' })
  findAll(@CurrentUser() user: any, @Query() query: QueryResourceDto) {
    return this.resourcesService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.resourcesService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Upload or create a new resource' })
  create(@CurrentUser() user: any, @Body() dto: CreateResourceDto) {
    return this.resourcesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a resource' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.resourcesService.remove(id, user.sub);
  }
}
