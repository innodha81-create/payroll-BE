import { Router } from 'express';
import { HirePilotController } from '../controller/hirepilot.controller.js';

const router = Router();

// Poster Generation
router.post('/generate-poster', HirePilotController.generatePoster);

// Job Openings Management & Posting
router.post('/openings', HirePilotController.createOpening);
router.get('/openings', HirePilotController.getOpenings);
router.get('/stats', HirePilotController.getStats);

// LinkedIn OAuth Handshake & Direct Posting
router.get('/linkedin/auth-url', HirePilotController.getLinkedInAuthUrl);
router.get('/linkedin/callback', HirePilotController.handleLinkedInCallback);

export const hirePilotRoutes = router;
