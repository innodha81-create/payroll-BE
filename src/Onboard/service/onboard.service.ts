import { OnboardModel } from '../model/onboard.model';
import { OnboardRecord, SaveOnboardPayload, UpdateOnboardPayload } from '../types/onboard.types';

export class OnboardService {
  public static async getAll(): Promise<OnboardRecord[]> {
    return await OnboardModel.getAll();
  }

  public static async getByCountryName(countryName: string): Promise<OnboardRecord | null> {
    if (!countryName || !countryName.trim()) {
      throw new Error('Country name parameter is required.');
    }
    return await OnboardModel.getByCountryName(countryName);
  }

  public static async getById(id: string): Promise<OnboardRecord | null> {
    if (!id || !id.trim()) {
      throw new Error('ID parameter is required.');
    }
    return await OnboardModel.getById(id);
  }

  public static async save(payload: SaveOnboardPayload): Promise<OnboardRecord> {
    if (!payload.country_name || !payload.country_name.trim()) {
      throw new Error('Country name is required.');
    }
    if (!payload.currency || !payload.currency.trim()) {
      throw new Error('Currency is required.');
    }
    if (payload.amount === undefined || payload.amount === null || payload.amount === '') {
      throw new Error('Onboard amount is required.');
    }

    return await OnboardModel.upsert(payload);
  }

  public static async update(id: string, payload: UpdateOnboardPayload): Promise<OnboardRecord | null> {
    if (!id || !id.trim()) {
      throw new Error('ID parameter is required.');
    }
    return await OnboardModel.update(id, payload);
  }

  public static async deleteById(id: string): Promise<boolean> {
    if (!id || !id.trim()) {
      throw new Error('ID parameter is required.');
    }
    return await OnboardModel.deleteById(id);
  }

  public static async deleteByCountryName(countryName: string): Promise<boolean> {
    if (!countryName || !countryName.trim()) {
      throw new Error('Country name parameter is required.');
    }
    return await OnboardModel.deleteByCountryName(countryName);
  }
}
