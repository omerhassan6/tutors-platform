import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ApiResponse, successResponse } from '../common/types/api-response.type';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async signUp(dto: SignUpDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          role: 'tutor',
          full_name: dto.fullName,
        },
      },
    });

    if (error) throw new BadRequestException(error.message);
    return successResponse({ user: data.user, session: data.session });
  }

  async login(dto: LoginDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) throw new UnauthorizedException(error.message);
    return successResponse({ user: data.user, session: data.session });
  }

  async logout(accessToken: string): Promise<ApiResponse<unknown>> {
    const { error } = await this.supabase.client.auth.admin.signOut(accessToken);
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ message: 'Logged out successfully' });
  }

  async getMe(userId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client.auth.admin.getUserById(userId);
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data.user);
  }
}
