import { Router } from 'express';
import { SubcompanyController } from '../controller/subcompany.controller';
import { authenticateToken } from '../../Login/middleware/login.middleware';

const router = Router();

// Subcompanies CRUD endpoints
router.post('/', authenticateToken, SubcompanyController.create);
router.get('/', authenticateToken, SubcompanyController.getByParent);
router.get('/:id', authenticateToken, SubcompanyController.getById);
router.put('/:id', authenticateToken, SubcompanyController.update);
router.patch('/:id/status', authenticateToken, SubcompanyController.toggleStatus);
router.delete('/:id', authenticateToken, SubcompanyController.remove);

export default router;
