"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_js_1 = require("./Login/index.js");
const index_js_2 = require("./Country/index.js");
const index_js_3 = require("./Pricing/index.js");
const index_js_4 = require("./Onboard/index.js");
const index_js_5 = require("./Companies/index.js");
const index_js_6 = require("./Subcompanies/index.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Trust proxy for Render/Cloudflare load balancers to get real client IP
app.set('trust proxy', true);
const allowedOrigins = [
    'https://icomplyone.com',
    'https://www.icomplyone.com',
    process.env.FRONTEND_URL || '',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl) or if in allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in production for all client subdomains/ports
    },
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Mount Login & Authentication Module
app.use('/api/auth', index_js_1.loginRoutes);
app.use('/api', index_js_1.loginRoutes); // Also supports /api/login, /api/logout, /api/forgot-password directly
// Mount Country Management Module
app.use('/api/country', index_js_2.countryRoutes);
app.use('/api/countries', index_js_2.countryRoutes);
// Mount Pricing Management Module
app.use('/api/pricing', index_js_3.pricingRoutes);
// Mount Onboard Management Module
app.use('/api/onboard', index_js_4.onboardRoutes);
app.use('/api/onboarding', index_js_4.onboardRoutes);
// Mount Companies Management Module
app.use('/api/companies', index_js_5.companyRoutes);
app.use('/api/company', index_js_5.companyRoutes);
// Mount Subcompanies Management Module
app.use('/api/subcompanies', index_js_6.subcompanyRoutes);
app.use('/api/subcompany', index_js_6.subcompanyRoutes);
// In-memory data store for demonstration
let employees = [
    {
        id: 'EMP-001',
        name: 'Sarah Connor',
        email: 'sarah.c@company.com',
        role: 'Lead Cloud Architect',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        baseSalary: 11500,
        bonus: 1200,
        deductions: 1850,
        netSalary: 10850,
        paymentStatus: 'Paid',
        paymentDate: '2026-10-01',
        bankAccount: '•••• 4829'
    },
    {
        id: 'EMP-002',
        name: 'Alex Rivera',
        email: 'alex.r@company.com',
        role: 'Senior Product Designer',
        department: 'Design',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        baseSalary: 9200,
        bonus: 800,
        deductions: 1400,
        netSalary: 8600,
        paymentStatus: 'Paid',
        paymentDate: '2026-10-01',
        bankAccount: '•••• 8912'
    },
    {
        id: 'EMP-003',
        name: 'Elena Rostova',
        email: 'elena.r@company.com',
        role: 'Full Stack Engineer',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        baseSalary: 8800,
        bonus: 600,
        deductions: 1250,
        netSalary: 8150,
        paymentStatus: 'Processing',
        paymentDate: '2026-10-15',
        bankAccount: '•••• 3341'
    },
    {
        id: 'EMP-004',
        name: 'Marcus Chen',
        email: 'marcus.c@company.com',
        role: 'Growth Marketing Lead',
        department: 'Marketing',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        baseSalary: 7900,
        bonus: 1100,
        deductions: 1150,
        netSalary: 7850,
        paymentStatus: 'Pending',
        paymentDate: '2026-10-15',
        bankAccount: '•••• 6019'
    },
    {
        id: 'EMP-005',
        name: 'Priya Sharma',
        email: 'priya.s@company.com',
        role: 'Financial Analyst',
        department: 'Finance',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        baseSalary: 8400,
        bonus: 500,
        deductions: 1300,
        netSalary: 7600,
        paymentStatus: 'Paid',
        paymentDate: '2026-10-01',
        bankAccount: '•••• 7183'
    },
    {
        id: 'EMP-006',
        name: 'David Kim',
        email: 'david.k@company.com',
        role: 'HR Business Partner',
        department: 'Human Resources',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        baseSalary: 7500,
        bonus: 400,
        deductions: 1100,
        netSalary: 6800,
        paymentStatus: 'Pending',
        paymentDate: '2026-10-15',
        bankAccount: '•••• 9204'
    }
];
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payroll-backend',
        version: '1.0.0'
    });
});
// Payroll summary endpoint
app.get('/api/payroll/summary', (_req, res) => {
    const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
    const pendingApprovals = employees.filter(emp => emp.paymentStatus === 'Pending').length;
    const summary = {
        totalMonthlyPayroll,
        activeEmployees: employees.length,
        pendingApprovals,
        nextPayDate: '2026-10-15',
        currency: 'USD',
        completedPayRuns: 18
    };
    res.json(summary);
});
// List all payroll employees
app.get('/api/payroll/employees', (req, res) => {
    const { department, status, search } = req.query;
    let filtered = [...employees];
    if (department && typeof department === 'string') {
        filtered = filtered.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }
    if (status && typeof status === 'string') {
        filtered = filtered.filter(e => e.paymentStatus.toLowerCase() === status.toLowerCase());
    }
    if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = filtered.filter(e => e.name.toLowerCase().includes(q) ||
            e.role.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q));
    }
    res.json(filtered);
});
// Run payroll (processes all pending)
app.post('/api/payroll/run', (_req, res) => {
    let updatedCount = 0;
    employees = employees.map(emp => {
        if (emp.paymentStatus === 'Pending' || emp.paymentStatus === 'Processing') {
            updatedCount++;
            return {
                ...emp,
                paymentStatus: 'Paid',
                paymentDate: new Date().toISOString().split('T')[0]
            };
        }
        return emp;
    });
    res.json({
        success: true,
        message: `Successfully executed pay run for ${updatedCount} employees`,
        processedCount: updatedCount,
        updatedAt: new Date().toISOString()
    });
});
// Update single employee status
app.patch('/api/payroll/employees/:id/status', (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const validStatuses = ['Paid', 'Processing', 'Pending'];
    if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }
    const employee = employees.find(e => e.id === id);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }
    employee.paymentStatus = paymentStatus;
    res.json({ success: true, employee });
});
// Default root endpoint
app.get('/', (_req, res) => {
    res.send('Payroll Backend Service is running. Access API endpoints under /api/health and /api/payroll');
});
app.listen(PORT, () => {
    console.log(`[payroll-backend] Server is actively listening on port ${PORT}`);
    console.log(`[payroll-backend] Health check at http://localhost:${PORT}/api/health`);
});
