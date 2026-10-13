import { Request, Response } from 'express';
import { CountryService } from '../service/country.service';

export class CountryController {
  /**
   * GET /api/country/all or /api/countries
   * Returns all countries added in database for Left Table
   */
  public static async getAllCountries(req: Request, res: Response): Promise<void> {
    try {
      const countries = await CountryService.getAllSavedCountries();
      res.status(200).json({
        success: true,
        message: 'Saved countries retrieved successfully.',
        data: countries
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve saved countries.'
      });
    }
  }

  /**
   * GET /api/country/world-list
   * Returns full world countries list from npm package for Right Searchable Dropdown
   */
  public static getWorldCountries(req: Request, res: Response): void {
    try {
      const worldList = CountryService.getWorldCountries();
      res.status(200).json({
        success: true,
        message: 'World countries list retrieved successfully.',
        data: worldList
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve world countries list.'
      });
    }
  }

  /**
   * POST /api/country/add or /api/countries
   * Add selected country to database with created_by and updated_by
   */
  public static async addCountry(req: Request, res: Response): Promise<void> {
    try {
      const { name, created_by, updated_by } = req.body;

      // Extract user from body, authenticated request, or JWT token
      let userIdentifier = created_by || (req as any).user?.email || (req as any).user?.sub;
      if (!userIdentifier) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const { verifyAccessToken } = require('../../Login/utils/token.utils');
            const decoded = verifyAccessToken(token);
            userIdentifier = decoded.email || decoded.sub;
          } catch {
            // Ignore token decode error and use fallback
          }
        }
      }

      const creator = userIdentifier || 'superadmin';
      const updater = updated_by || creator;

      const created = await CountryService.addCountry(name, creator, updater);
      res.status(201).json({
        success: true,
        message: `Country "${created.name}" added successfully.`,
        data: created
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to add country.'
      });
    }
  }

  /**
   * DELETE /api/country/:id or /api/countries/:id
   * Delete country from database
   */
  public static async deleteCountry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await CountryService.deleteCountry(id);
      res.status(200).json({
        success: true,
        message: 'Country deleted successfully.'
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to delete country.'
      });
    }
  }
}
