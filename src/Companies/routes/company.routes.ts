import { Router } from 'express';
import { CompanyController } from '../controller/company.controller';

const router = Router();

// Create Company + Admin User
router.post('/', CompanyController.createCompany);

// List All Companies with search, filter, pagination
router.get('/', CompanyController.getAllCompanies);

// Get Single Company details by ID
router.get('/:id', CompanyController.getCompanyById);

// Update Company details
router.put('/:id', CompanyController.updateCompany);

// Toggle Company Active / Inactive status
router.patch('/:id/status', CompanyController.updateStatus);

// Update Company User Allocation & Breakdown
router.patch('/:id/users', CompanyController.updateUserAllocation);

// Delete Company
router.delete('/:id', CompanyController.deleteCompany);

export const companyRoutes = router;
