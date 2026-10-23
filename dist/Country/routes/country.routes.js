"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const country_controller_1 = require("../controller/country.controller");
const country_middleware_1 = require("../middleware/country.middleware");
const router = (0, express_1.Router)();
// 1. Get all countries saved in database (Left Table)
router.get('/all', country_controller_1.CountryController.getAllCountries);
router.get('/', country_controller_1.CountryController.getAllCountries);
// 2. Get complete list of world countries via country-list npm (Right Searchable Dropdown)
router.get('/world-list', country_controller_1.CountryController.getWorldCountries);
// 3. Add selected country to database
router.post('/add', country_middleware_1.validateAddCountry, country_controller_1.CountryController.addCountry);
router.post('/', country_middleware_1.validateAddCountry, country_controller_1.CountryController.addCountry);
// 4. Delete country by ID (Left Table Action Button)
router.delete('/delete/:id', country_middleware_1.validateCountryId, country_controller_1.CountryController.deleteCountry);
router.delete('/:id', country_middleware_1.validateCountryId, country_controller_1.CountryController.deleteCountry);
exports.default = router;
