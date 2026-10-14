export type UserRole = 'superadmin' | 'companyadmin' | 'user' | 'employee';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  is_active: boolean;
  company_id?: string | null;
  company_status?: string | null;
  company_name?: string | null;
  company_logo?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
