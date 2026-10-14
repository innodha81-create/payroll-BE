import { Request, Response } from 'express';
import { CompanyService } from '../service/company.service';
import { CreateCompanyDto, UpdateCompanyDto } from '../types/company.types';

export class CompanyController {
  /**
   * POST /api/companies
   * Create Company + Admin User
   */
  public static async createCompany(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateCompanyDto = req.body;
      const data = await CompanyService.createCompany(dto);

      res.status(201).json({
        success: true,
        message: 'Company and Admin User registered successfully.',
        data
      });
    } catch (err: any) {
      console.error('[CompanyController.createCompany Error]:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to create company.'
      });
    }
  }

  /**
   * GET /api/companies
   * List all companies with search, pagination, and filter
   */
  public static async getAllCompanies(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await CompanyService.getAllCompanies({ search, status, page, limit });

      res.status(200).json({
        success: true,
        message: 'Companies retrieved successfully.',
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: result.companies
      });
    } catch (err: any) {
      console.error('[CompanyController.getAllCompanies Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve companies.'
      });
    }
  }

  /**
   * GET /api/companies/:id
   * Get single company details with linked admin
   */
  public static async getCompanyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await CompanyService.getCompanyById(id);

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Company not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Company details retrieved successfully.',
        data
      });
    } catch (err: any) {
      console.error('[CompanyController.getCompanyById Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve company details.'
      });
    }
  }

  /**
   * PUT /api/companies/:id
   * Update company details
   */
  public static async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateCompanyDto = req.body;

      const data = await CompanyService.updateCompany(id, dto);

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Company not found to update.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Company updated successfully.',
        data
      });
    } catch (err: any) {
      console.error('[CompanyController.updateCompany Error]:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update company.'
      });
    }
  }

  /**
   * PATCH /api/companies/:id/status
   * Toggle Active / Inactive status
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const success = await CompanyService.updateStatus(id, status);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Company not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Company status updated to ${status}.`
      });
    } catch (err: any) {
      console.error('[CompanyController.updateStatus Error]:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update company status.'
      });
    }
  }

  /**
   * PATCH /api/companies/:id/users
   * Update company user allocation and country user breakdown
   */
  public static async updateUserAllocation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { users, countryUserCounts } = req.body;

      if (users === undefined || isNaN(parseInt(users))) {
        res.status(400).json({
          success: false,
          error: 'Valid users count is required.'
        });
        return;
      }

      const data = await CompanyService.updateUserAllocation(
        id,
        parseInt(users, 10),
        countryUserCounts || {}
      );

      if (!data) {
        res.status(404).json({
          success: false,
          error: 'Company not found to update users.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Company user allocation updated successfully in database.',
        data
      });
    } catch (err: any) {
      console.error('[CompanyController.updateUserAllocation Error]:', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update user allocation.'
      });
    }
  }

  /**
   * DELETE /api/companies/:id
   * Delete company
   */
  public static async deleteCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await CompanyService.deleteCompany(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Company not found to delete.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Company deleted successfully.'
      });
    } catch (err: any) {
      console.error('[CompanyController.deleteCompany Error]:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete company.'
      });
    }
  }
}
