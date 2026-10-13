import { Router } from 'express';
import { CountryController } from '../controller/country.controller';
import { validateAddCountry, validateCountryId } from '../middleware/country.middleware';

const router = Router();

// 1. Get all countries saved in database (Left Table)
router.get('/all', CountryController.getAllCountries);
router.get('/', CountryController.getAllCountries);

// 2. Get complete list of world countries via country-list npm (Right Searchable Dropdown)
router.get('/world-list', CountryController.getWorldCountries);

// 3. Add selected country to database
router.post('/add', validateAddCountry, CountryController.addCountry);
router.post('/', validateAddCountry, CountryController.addCountry);

// 4. Delete country by ID (Left Table Action Button)
router.delete('/delete/:id', validateCountryId, CountryController.deleteCountry);
router.delete('/:id', validateCountryId, CountryController.deleteCountry);

export default router;
