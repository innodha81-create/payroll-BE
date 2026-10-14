import { Request, Response } from 'express';
import { HirePilotService } from '../service/hirepilot.service.js';
import { HirePilotModel } from '../model/hirepilot.model.js';
import { LinkedInService } from '../service/linkedin.service.js';

export class HirePilotController {
  /**
   * Generate AI poster specification using multi-industry Gemini cascade
   */
  public static async generatePoster(req: Request, res: Response): Promise<void> {
    try {
      const { jobTitle, description, lastApplyDate, companyName, employeeName, platforms } = req.body;

      if (!jobTitle || !jobTitle.trim()) {
        res.status(400).json({
          success: false,
          message: 'Job title is required to generate a poster.'
        });
        return;
      }

      const posterData = await HirePilotService.generateJobPoster({
        jobTitle: jobTitle.trim(),
        description: description?.trim() || '',
        lastApplyDate: lastApplyDate?.trim() || '',
        companyName: companyName?.trim() || 'Company',
        employeeName: employeeName?.trim() || '',
        platforms: Array.isArray(platforms) ? platforms : []
      });

      res.status(200).json({
        success: true,
        data: posterData
      });
    } catch (error: any) {
      console.error('[HirePilotController] generatePoster failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate poster. Please try again.',
        error: error.message
      });
    }
  }

  /**
   * Create Job Opening and publish to LinkedIn if selected
   */
  public static async createOpening(req: Request, res: Response): Promise<void> {
    try {
      const {
        companyId,
        employeeName,
        jobTitle,
        lastApplyDate,
        description,
        posterData,
        sharedPlatforms
      } = req.body;

      if (!jobTitle || !jobTitle.trim()) {
        res.status(400).json({
          success: false,
          message: 'Job title is required.'
        });
        return;
      }

      // 1. Save Job Opening in Database
      const opening = await HirePilotModel.createOpening({
        companyId,
        employeeName: employeeName?.trim() || '',
        jobTitle: jobTitle.trim(),
        lastApplyDate: lastApplyDate?.trim() || '',
        description: description?.trim() || '',
        posterData: posterData || {},
        sharedPlatforms: Array.isArray(sharedPlatforms) ? sharedPlatforms : []
      });

      // 2. Publish to LinkedIn if selected
      let linkedInResult = null;
      const platformsList = Array.isArray(sharedPlatforms)
        ? sharedPlatforms.map((p) => String(p).toLowerCase())
        : [];

      if (platformsList.includes('linkedin')) {
        const postText =
          posterData?.socialCaption ||
          `📢 We are hiring: ${jobTitle}!\n\nApply before: ${lastApplyDate || 'Immediate'}\nContact: ${employeeName || 'Talent Acquisition'}\n\n#Hiring #${jobTitle.replace(/[^a-zA-Z0-9]/g, '')} #CareerOpportunity`;

        linkedInResult = await LinkedInService.publishJobPost(companyId, postText);
      }

      res.status(201).json({
        success: true,
        data: opening,
        linkedIn: linkedInResult,
        message: linkedInResult?.published
          ? 'Opening created and published directly to LinkedIn!'
          : 'Opening created successfully!'
      });
    } catch (error: any) {
      console.error('[HirePilotController] createOpening failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create job opening.',
        error: error.message
      });
    }
  }

  /**
   * Get all openings
   */
  public static async getOpenings(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.query.companyId as string) || (req.query.company_id as string) || null;
      const openings = await HirePilotModel.getOpenings(companyId);

      res.status(200).json({
        success: true,
        data: openings
      });
    } catch (error: any) {
      console.error('[HirePilotController] getOpenings failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch job openings.',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard statistics
   */
  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.query.companyId as string) || (req.query.company_id as string) || null;
      const stats = await HirePilotModel.getStats(companyId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[HirePilotController] getStats failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics.',
        error: error.message
      });
    }
  }

  /**
   * Get LinkedIn OAuth Authorization URL
   */
  public static async getLinkedInAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.query.companyId as string) || (req.query.company_id as string) || null;
      const authUrl = await LinkedInService.getAuthUrl(companyId);

      res.status(200).json({
        success: true,
        authUrl,
        redirectUri: LinkedInService.getRedirectUri()
      });
    } catch (error: any) {
      console.error('[HirePilotController] getLinkedInAuthUrl failed:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Could not generate LinkedIn authorization URL.'
      });
    }
  }

  /**
   * Handle LinkedIn OAuth Callback from browser
   */
  public static async handleLinkedInCallback(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;
      const errorDescription = req.query.error_description as string;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (error) {
        console.error('[LinkedIn OAuth] Error from LinkedIn:', error, errorDescription);
        res.redirect(`${frontendUrl}/companyadmin/hirepilot?linkedin_error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      if (!code) {
        res.redirect(`${frontendUrl}/companyadmin/hirepilot?linkedin_error=No_Code_Provided`);
        return;
      }

      await LinkedInService.handleCallback(code, state);

      // Redirect user back to HirePilot dashboard with success banner
      res.redirect(`${frontendUrl}/companyadmin/hirepilot?linkedin_auth=success`);
    } catch (error: any) {
      console.error('[HirePilotController] handleLinkedInCallback failed:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/companyadmin/hirepilot?linkedin_error=${encodeURIComponent(
          error.message || 'OAuth_Failed'
        )}`
      );
    }
  }
}
