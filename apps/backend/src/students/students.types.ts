export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface Student {
  id: string;
  tutor_id: string;
  name: string;
  email?: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  batch_id: string;
  status: StudentStatus;
  note?: string;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
