export type PlatformType = 'linkedin' | 'instagram' | 'naukri' | 'indeed';

export interface PilotCredentialRecord {
  id: string;
  companyId?: string | null;
  platform: PlatformType;
  clientId: string;
  clientSecret: string;
  isActive: boolean;
  accessToken?: string;
  authorUrn?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePilotCredentialDto {
  platform: PlatformType;
  clientId: string;
  clientSecret: string;
  companyId?: string | null;
  accessToken?: string;
  authorUrn?: string;
  authorName?: string;
}

export interface UpdatePilotCredentialDto {
  platform?: PlatformType;
  clientId?: string;
  clientSecret?: string;
  isActive?: boolean;
  accessToken?: string;
  authorUrn?: string;
  authorName?: string;
}
