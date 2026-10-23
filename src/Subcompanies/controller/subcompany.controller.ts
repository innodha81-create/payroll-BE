import { Request, Response } from 'express';
import { SubcompanyService } from '../service/subcompany.service';
import { AuthenticatedRequest } from '../../Login/middleware/login.middleware';

export class SubcompanyController {
  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parentId = req.body.parent_company_id || (req.user as any)?.companyId || (req.user as any)?.company_id;
      if (!parentId) {
        res.status(400).json({ success: false, error: 'Parent company ID is required.' });
        return;
      }

      const subcompany = await SubcompanyService.createSubcompany({
        ...req.body,
        parent_company_id: parentId
      });

      res.status(201).json({
        success: true,
        message: 'Subcompany created successfully.',
        data: subcompany
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to create subcompany.' });
    }
  }

  public static async getByParent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parentId = (req.query.parent_company_id as string) || (req.user as any)?.companyId || (req.user as any)?.company_id;
      if (!parentId) {
        res.status(400).json({ success: false, error: 'Parent company ID is required.' });
        return;
      }

      const list = await SubcompanyService.getSubcompaniesByParent(parentId);
      res.status(200).json({
        success: true,
        data: list
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch subcompanies.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const subcompany = await SubcompanyService.getSubcompanyById(req.params.id);
      if (!subcompany) {
        res.status(404).json({ success: false, error: 'Subcompany not found.' });
        return;
      }
      res.status(200).json({ success: true, data: subcompany });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch subcompany.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await SubcompanyService.updateSubcompany(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Subcompany not found.' });
        return;
      }
      res.status(200).json({ success: true, message: 'Subcompany updated successfully.', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update subcompany.' });
    }
  }

  public static async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (status !== 'Active' && status !== 'Inactive') {
        res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
        return;
      }
      const success = await SubcompanyService.updateStatus(req.params.id, status);
      if (!success) {
        res.status(404).json({ success: false, error: 'Subcompany not found.' });
        return;
      }
      res.status(200).json({ success: true, message: `Status updated to ${status}.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update status.' });
    }
  }

  public static async remove(req: Request, res: Response): Promise<void> {
    try {
      const success = await SubcompanyService.deleteSubcompany(req.params.id);
      if (!success) {
        res.status(404).json({ success: false, error: 'Subcompany not found.' });
        return;
      }
      res.status(200).json({ success: true, message: 'Subcompany deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to delete subcompany.' });
    }
  }
}
