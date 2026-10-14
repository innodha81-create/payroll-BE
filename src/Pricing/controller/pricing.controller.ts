import { Request, Response } from 'express';
import { PricingService } from '../service/pricing.service';
import { SavePricingPayload } from '../types/pricing.types';

export class PricingController {
  /**
   * GET /api/pricing/all
   * Returns all pricing summaries and records for Left Card Table
   */
  public static async getAllPricings(req: Request, res: Response): Promise<void> {
    try {
      const data = await PricingService.getAllPricings();
      res.status(200).json({
        success: true,
        message: 'Pricing records retrieved successfully.',
        data
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve pricing records.'
      });
    }
  }

  /**
   * GET /api/pricing/by-root/:countryName
   * Returns prices for a specific Root Country
   */
  public static async getByRootCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryName } = req.params;
      if (!countryName) {
        res.status(400).json({ success: false, error: 'Country name parameter is required.' });
        return;
      }

      const data = await PricingService.getPricingByRootCountry(countryName);
      if (!data) {
        res.status(200).json({
          success: true,
          message: `No pricing found for ${countryName}.`,
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Pricing for ${countryName} retrieved successfully.`,
        data
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve pricing for root country.'
      });
    }
  }

  /**
   * POST /api/pricing/save
   * Save or update pricing matrix
   */
  public static async savePricing(req: Request, res: Response): Promise<void> {
    try {
      const payload: SavePricingPayload = req.body;
      const records = await PricingService.savePricing(payload);

      res.status(200).json({
        success: true,
        message: `Pricing for ${payload.root_country_name} saved successfully.`,
        data: records
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to save pricing.'
      });
    }
  }

  /**
   * DELETE /api/pricing/by-root/:countryName
   * Delete all pricing for a root country
   */
  public static async deleteByRootCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryName } = req.params;
      const deleted = await PricingService.deleteByRootCountry(countryName);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `No pricing found to delete for ${countryName}.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Pricing for ${countryName} deleted successfully.`
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete pricing.'
      });
    }
  }

  /**
   * DELETE /api/pricing/:id
   * Delete a single pricing record by ID
   */
  public static async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await PricingService.deleteById(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Pricing record not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pricing record deleted successfully.'
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete pricing record.'
      });
    }
  }
}
