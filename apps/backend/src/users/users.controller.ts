import { Controller, Get, Post, Body } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll()
  }

  @Post()
  async create(@Body() body: any) {
    return this.usersService.create(body)
  }
}
