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
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('batches')
@ApiBearerAuth()
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all batches for the authenticated tutor' })
  findAll(@CurrentUser() user: any) {
    return this.batchesService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.batchesService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new batch' })
  create(@CurrentUser() user: any, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a batch' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.batchesService.remove(id, user.sub);
  }
}
