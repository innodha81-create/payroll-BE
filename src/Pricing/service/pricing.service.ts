import { PricingModel } from '../model/pricing.model';
import { PricingRecord, RootPricingSummary, SavePricingPayload } from '../types/pricing.types';

export class PricingService {
  /**
   * Get all pricing records grouped by Root Country
   * Also returns individual raw records
   */
  public static async getAllPricings(): Promise<{
    summaries: RootPricingSummary[];
    records: PricingRecord[];
  }> {
    const records = await PricingModel.getAllPricings();

    const summaries: RootPricingSummary[] = records.map((r) => {
      const pricesObj = r.prices || {};
      return {
        root_country_name: r.root_country_name,
        currency: r.currency,
        total_targets: Object.keys(pricesObj).length,
        prices: pricesObj,
        updated_at: r.updated_at
      };
    });

    return {
      summaries,
      records
    };
  }

  /**
   * Get pricing details for a specific Root Country
   */
  public static async getPricingByRootCountry(rootCountryName: string): Promise<PricingRecord | null> {
    return await PricingModel.getByRootCountry(rootCountryName);
  }

  /**
   * Bulk Save / Upsert pricing configuration
   */
  public static async savePricing(payload: SavePricingPayload): Promise<PricingRecord> {
    if (!payload.root_country_name || !payload.root_country_name.trim()) {
      throw new Error('Root country name is required.');
    }
    if (!payload.currency || !payload.currency.trim()) {
      throw new Error('Currency is required.');
    }
    const hasPrices = Array.isArray(payload.prices)
      ? payload.prices.length > 0
      : payload.prices && Object.keys(payload.prices).length > 0;
    if (!hasPrices) {
      throw new Error('At least one country price must be provided.');
    }

    return await PricingModel.upsertPrices(payload);
  }

  /**
   * Delete pricing by root country
   */
  public static async deleteByRootCountry(rootCountryName: string): Promise<boolean> {
    const deletedCount = await PricingModel.deleteByRootCountry(rootCountryName);
    return deletedCount > 0;
  }

  /**
   * Delete a single pricing record by ID or Country Name
   */
  public static async deleteById(id: string): Promise<boolean> {
    return await PricingModel.deleteById(id);
  }
}

