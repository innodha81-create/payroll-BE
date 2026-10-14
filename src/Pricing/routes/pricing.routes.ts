import { Router } from 'express';
import { PricingController } from '../controller/pricing.controller';

const router = Router();

// GET all pricing
router.get('/all', PricingController.getAllPricings);

// GET pricing by Root Country
router.get('/by-root/:countryName', PricingController.getByRootCountry);

// POST save / upsert pricing
router.post('/save', PricingController.savePricing);

// DELETE pricing by Root Country
router.delete('/by-root/:countryName', PricingController.deleteByRootCountry);

// DELETE single pricing record by ID
router.delete('/:id', PricingController.deleteById);

export default router;
