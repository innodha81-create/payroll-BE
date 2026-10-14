import { Request, Response } from 'express';
import { PilotSettingService } from '../service/pilotsetting.service';
import { CreatePilotCredentialDto, UpdatePilotCredentialDto } from '../types/pilotsetting.types';

export class PilotSettingController {
  /**
   * POST /api/pilotsetting
   * Create new credential (Blocks duplicate platform)
   */
  public static async createCredential(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreatePilotCredentialDto = req.body;
      const data = await PilotSettingService.createCredential(dto);

      res.status(201).json({
        success: true,
        message: `${data.platform.toUpperCase()} credentials saved successfully.`,
        data
      });
    } catch (err: any) {
      console.error('[PilotSettingController.createCredential Error]:', err.message);
      const isDuplicate = err.message?.includes('already exist');
      res.status(isDuplicate ? 409 : 400).json({
        success: false,
        error: err.message || 'Failed to save credentials.'
      });
    }
  }

  /**
   * GET /api/pilotsetting
   * List all credentials (optionally by companyId)
   */
  public static async getAllCredentials(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.query.companyId as string) || (req.body?.companyId as string) || undefined;
      const data = await PilotSettingService.getAllCredentials(companyId);

      res.status(200).json({
        success: true,
        message: 'Credentials retrieved successfully.',
        total: data.length,
        data
      });
    } catch (err: any) {
      console.error('[PilotSettingController.getAllCredentials Error]:', err.message);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve credentials.'
      });
    }
  }

  /**
   * GET /api/pilotsetting/:id
   * View single credential by ID
   */
  public static async getCredentialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await PilotSettingService.getCredentialById(id);

      res.status(200).json({
        success: true,
        message: 'Credential details retrieved successfully.',
        data
      });
    } catch (err: any) {
      console.error('[PilotSettingController.getCredentialById Error]:', err.message);
      const isNotFound = err.message?.includes('not found');
      res.status(isNotFound ? 404 : 400).json({
        success: false,
        error: err.message || 'Failed to retrieve credential.'
      });
    }
  }

  /**
   * PUT /api/pilotsetting/:id
   * Update credential details
   */
  public static async updateCredential(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdatePilotCredentialDto = req.body;
      const data = await PilotSettingService.updateCredential(id, dto);

      res.status(200).json({
        success: true,
        message: `${data.platform.toUpperCase()} credentials updated successfully.`,
        data
      });
    } catch (err: any) {
      console.error('[PilotSettingController.updateCredential Error]:', err.message);
      const isNotFound = err.message?.includes('not found');
      const isDuplicate = err.message?.includes('already exist');
      res.status(isNotFound ? 404 : isDuplicate ? 409 : 400).json({
        success: false,
        error: err.message || 'Failed to update credentials.'
      });
    }
  }

  /**
   * DELETE /api/pilotsetting/:id
   * Delete credential
   */
  public static async deleteCredential(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PilotSettingService.deleteCredential(id);

      res.status(200).json({
        success: true,
        message: 'Credential deleted successfully.'
      });
    } catch (err: any) {
      console.error('[PilotSettingController.deleteCredential Error]:', err.message);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to delete credential.'
      });
    }
  }
}
