import { Request, Response } from 'express';
import { OnboardService } from '../service/onboard.service';
import { SaveOnboardPayload, UpdateOnboardPayload } from '../types/onboard.types';

export class OnboardController {
  /**
   * GET /api/onboard/all
   * Returns all onboard records for available countries
   */
  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await OnboardService.getAll();
      res.status(200).json({
        success: true,
        message: 'Onboard records retrieved successfully.',
        data
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve onboard records.'
      });
    }
  }

  /**
   * GET /api/onboard/by-country/:countryName
   * Returns onboard record for specific country
   */
  public static async getByCountryName(req: Request, res: Response): Promise<void> {
    try {
      const { countryName } = req.params;
      const data = await OnboardService.getByCountryName(countryName);

      if (!data) {
        res.status(200).json({
          success: true,
          message: `No onboard configuration found for ${countryName}.`,
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Onboard configuration for ${countryName} retrieved successfully.`,
        data
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve onboard configuration.'
      });
    }
  }

  /**
   * GET /api/onboard/:id
   * Returns onboard record by ID
   */
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await OnboardService.getById(id);

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Onboard record not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Onboard record retrieved successfully.',
        data
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve onboard record.'
      });
    }
  }

  /**
   * POST /api/onboard/save
   * Add or upsert onboard fee configuration
   */
  public static async save(req: Request, res: Response): Promise<void> {
    try {
      const payload: SaveOnboardPayload = req.body;
      const record = await OnboardService.save(payload);

      res.status(200).json({
        success: true,
        message: `Onboard fee for ${payload.country_name} saved successfully.`,
        data: record
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to save onboard fee.'
      });
    }
  }

  /**
   * PUT /api/onboard/update/:id
   * Update onboard fee configuration by ID
   */
  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload: UpdateOnboardPayload = req.body;
      const updated = await OnboardService.update(id, payload);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Onboard record not found to update.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Onboard fee updated successfully.',
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update onboard fee.'
      });
    }
  }

  /**
   * DELETE /api/onboard/by-country/:countryName
   * Delete onboard fee by country name
   */
  public static async deleteByCountryName(req: Request, res: Response): Promise<void> {
    try {
      const { countryName } = req.params;
      const deleted = await OnboardService.deleteByCountryName(countryName);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `No onboard configuration found for ${countryName}.`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Onboard fee for ${countryName} deleted successfully.`
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete onboard fee.'
      });
    }
  }

  /**
   * DELETE /api/onboard/:id
   * Delete onboard record by ID
   */
  public static async deleteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await OnboardService.deleteById(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Onboard record not found to delete.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Onboard fee record deleted successfully.'
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete onboard record.'
      });
    }
  }
}
