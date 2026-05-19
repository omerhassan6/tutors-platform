import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { QueryFeeDto } from './dto/query-fee.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('fees')
@ApiBearerAuth()
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all fee records for the authenticated tutor' })
  findAll(@CurrentUser() user: any, @Query() query: QueryFeeDto) {
    return this.feesService.findAll(user.sub, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get fee summary: totalPending, totalPaid, overdueCount' })
  getSummary(@CurrentUser() user: any) {
    return this.feesService.getSummary(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a fee record by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.feesService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fee record' })
  create(@CurrentUser() user: any, @Body() dto: CreateFeeDto) {
    return this.feesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fee record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateFeeDto,
  ) {
    return this.feesService.update(id, user.sub, dto);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a fee as paid' })
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { paidDate?: string },
  ) {
    return this.feesService.markPaid(id, user.sub, body.paidDate);
  }
}
