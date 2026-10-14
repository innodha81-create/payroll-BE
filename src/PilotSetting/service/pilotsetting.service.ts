import { PilotSettingModel } from '../model/pilotsetting.model';
import {
  PilotCredentialRecord,
  CreatePilotCredentialDto,
  UpdatePilotCredentialDto,
  PlatformType
} from '../types/pilotsetting.types';

const PLATFORM_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  naukri: 'Naukri',
  indeed: 'Indeed'
};

export class PilotSettingService {
  /**
   * Create new credential with strict validation:
   * "IPo linked alredy created la irunth create panna vidakudathu"
   */
  public static async createCredential(
    dto: CreatePilotCredentialDto
  ): Promise<PilotCredentialRecord> {
    if (!dto.platform) {
      throw new Error('Platform is required (e.g. linkedin, instagram, naukri, indeed).');
    }

    const platformKey = dto.platform.toLowerCase() as PlatformType;
    if (!['linkedin', 'instagram', 'naukri', 'indeed'].includes(platformKey)) {
      throw new Error('Invalid platform. Allowed values: linkedin, instagram, naukri, indeed.');
    }

    if (!dto.clientId || !dto.clientId.trim()) {
      throw new Error('Client Id is required.');
    }

    if (!dto.clientSecret || !dto.clientSecret.trim()) {
      throw new Error('Primary Client Secret is required.');
    }

    // Check if platform is already created
    const existing = await PilotSettingModel.findByPlatform(platformKey, dto.companyId);
    if (existing) {
      const platformName = PLATFORM_NAMES[platformKey] || platformKey;
      throw new Error(
        `Credentials for ${platformName} already exist. Please update existing credentials instead.`
      );
    }

    return await PilotSettingModel.create({
      ...dto,
      platform: platformKey
    });
  }

  /**
   * Get all credentials
   */
  public static async getAllCredentials(
    companyId?: string | null
  ): Promise<PilotCredentialRecord[]> {
    return await PilotSettingModel.getAll(companyId);
  }

  /**
   * Get credential by ID
   */
  public static async getCredentialById(
    id: string
  ): Promise<PilotCredentialRecord> {
    if (!id) {
      throw new Error('Credential ID is required.');
    }

    const cred = await PilotSettingModel.findById(id);
    if (!cred) {
      throw new Error(`Credential with ID ${id} not found.`);
    }

    return cred;
  }

  /**
   * Update credential with validation
   */
  public static async updateCredential(
    id: string,
    dto: UpdatePilotCredentialDto
  ): Promise<PilotCredentialRecord> {
    if (!id) {
      throw new Error('Credential ID is required.');
    }

    const existing = await PilotSettingModel.findById(id);
    if (!existing) {
      throw new Error(`Credential with ID ${id} not found.`);
    }

    // If changing platform, ensure new platform is not already created by another entry
    if (dto.platform && dto.platform.toLowerCase() !== existing.platform.toLowerCase()) {
      const platformKey = dto.platform.toLowerCase() as PlatformType;
      const conflict = await PilotSettingModel.findByPlatform(platformKey, existing.companyId);
      if (conflict && conflict.id !== id) {
        const platformName = PLATFORM_NAMES[platformKey] || platformKey;
        throw new Error(
          `Credentials for ${platformName} already exist on another record.`
        );
      }
    }

    const updated = await PilotSettingModel.update(id, dto);
    if (!updated) {
      throw new Error('Failed to update credentials.');
    }

    return updated;
  }

  /**
   * Delete credential
   */
  public static async deleteCredential(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Credential ID is required.');
    }
    const success = await PilotSettingModel.delete(id);
    if (!success) {
      throw new Error(`Credential with ID ${id} not found or could not be deleted.`);
    }
    return true;
  }
}
