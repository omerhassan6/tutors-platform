import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new tutor account' })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate session' })
  logout(@Req() req: Request) {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user' })
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }
}
