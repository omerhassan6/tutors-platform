import { Injectable } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

@Injectable()
export class UsersService {
  async findAll() {
    const { data, error } = await supabase.from('users').select('*')
    if (error) throw error
    return data
  }

  async create(payload: any) {
    const { data, error } = await supabase.from('users').insert([payload]).select()
    if (error) throw error
    return data?.[0]
  }
}
