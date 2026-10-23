"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddCountry = validateAddCountry;
exports.validateCountryId = validateCountryId;
function validateAddCountry(req, res, next) {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: 'Please provide a valid country name.'
        });
        return;
    }
    next();
}
function validateCountryId(req, res, next) {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: 'Country ID is required.'
        });
        return;
    }
    next();
}
