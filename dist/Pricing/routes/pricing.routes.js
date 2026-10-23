"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pricing_controller_1 = require("../controller/pricing.controller");
const router = (0, express_1.Router)();
// GET all pricing
router.get('/all', pricing_controller_1.PricingController.getAllPricings);
// GET pricing by Root Country
router.get('/by-root/:countryName', pricing_controller_1.PricingController.getByRootCountry);
// POST save / upsert pricing
router.post('/save', pricing_controller_1.PricingController.savePricing);
// DELETE pricing by Root Country
router.delete('/by-root/:countryName', pricing_controller_1.PricingController.deleteByRootCountry);
// DELETE single pricing record by ID
router.delete('/:id', pricing_controller_1.PricingController.deleteById);
exports.default = router;
