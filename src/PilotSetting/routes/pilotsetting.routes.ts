import { Router } from 'express';
import { PilotSettingController } from '../controller/pilotsetting.controller';

const router = Router();

// Create new credential (Blocks duplicate platform)
router.post('/', PilotSettingController.createCredential);

// List all credentials (or filter by ?companyId=...)
router.get('/', PilotSettingController.getAllCredentials);

// View single credential by ID
router.get('/:id', PilotSettingController.getCredentialById);

// Update credential by ID
router.put('/:id', PilotSettingController.updateCredential);

// Delete credential by ID
router.delete('/:id', PilotSettingController.deleteCredential);

export const pilotSettingRoutes = router;
