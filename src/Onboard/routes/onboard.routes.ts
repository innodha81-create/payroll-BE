import { Router } from 'express';
import { OnboardController } from '../controller/onboard.controller';

const router = Router();

router.get('/all', OnboardController.getAll);
router.get('/by-country/:countryName', OnboardController.getByCountryName);
router.get('/:id', OnboardController.getById);

router.post('/save', OnboardController.save);
router.post('/add', OnboardController.save);

router.put('/update/:id', OnboardController.update);

router.delete('/by-country/:countryName', OnboardController.deleteByCountryName);
router.delete('/:id', OnboardController.deleteById);

export default router;
