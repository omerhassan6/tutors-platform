import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, email, created_at')
    if (error) throw new InternalServerErrorException(error.message)
    return data ?? []
  }

  async create(payload: Record<string, unknown>) {
    const { data, error } = await this.supabase.client
      .from('users')
      .insert([payload])
      .select('id, email, created_at')
    if (error) throw new InternalServerErrorException(error.message)
    return data?.[0]
  }
}
