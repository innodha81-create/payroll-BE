import countryList from 'country-list';
import { CountryModel } from '../model/country.model';
import { CountryRecord, WorldCountryItem } from '../types/country.types';

// country-telephone-data CommonJS export
const { allCountries } = require('country-telephone-data');

export class CountryService {
  /**
   * Get all world countries using country-list & country-telephone-data npm packages
   */
  public static getWorldCountries(): WorldCountryItem[] {
    const rawData = countryList.getData();
    return rawData
      .map((item) => {
        const phoneMatch = allCountries.find((p: any) => p.iso2 === item.code.toLowerCase());
        return {
          code: item.code,
          name: item.name,
          phoneCode: phoneMatch?.dialCode ? `+${phoneMatch.dialCode}` : undefined
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all active/saved countries from the database for the left table
   */
  public static async getAllSavedCountries(): Promise<CountryRecord[]> {
    const records = await CountryModel.getAllCountries();
    return records.map((r) => {
      if (!r.phone_code && r.code) {
        const match = allCountries.find((c: any) => c.iso2 === r.code?.toLowerCase());
        if (match?.dialCode) {
          r.phone_code = `+${match.dialCode}`;
        }
      }
      return r;
    });
  }

  /**
   * Add a new country to the database
   */
  public static async addCountry(
    name: string,
    created_by?: string,
    updated_by?: string
  ): Promise<CountryRecord> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Country name is required.');
    }

    const existing = await CountryModel.findByName(trimmedName);
    if (existing) {
      throw new Error(`Country "${trimmedName}" is already added.`);
    }

    // Try finding ISO 2-letter code from country-list
    const code = countryList.getCode(trimmedName) || null;
    let phoneCode: string | null = null;
    if (code) {
      const match = allCountries.find((c: any) => c.iso2 === code.toLowerCase());
      if (match?.dialCode) {
        phoneCode = `+${match.dialCode}`;
      }
    }

    try {
      return await CountryModel.createCountry(
        trimmedName,
        code || undefined,
        phoneCode || undefined,
        created_by,
        updated_by
      );
    } catch (dbErr: any) {
      if (dbErr.code === '23505') {
        throw new Error(`Country "${trimmedName}" is already added.`);
      }
      throw dbErr;
    }
  }

  /**
   * Delete country by ID
   */
  public static async deleteCountry(id: string): Promise<void> {
    const existing = await CountryModel.findById(id);
    if (!existing) {
      throw new Error('Country not found.');
    }

    const success = await CountryModel.deleteCountry(id);
    if (!success) {
      throw new Error('Failed to delete country.');
    }
  }
}
