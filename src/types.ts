export interface EmployeePayroll {
  id: string;
  name: string;
  email: string;
  role: string;
  department: 'Engineering' | 'Design' | 'Marketing' | 'Human Resources' | 'Finance';
  avatar: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'Paid' | 'Processing' | 'Pending';
  paymentDate: string;
  bankAccount: string;
}

export interface PayrollSummary {
  totalMonthlyPayroll: number;
  activeEmployees: number;
  pendingApprovals: number;
  nextPayDate: string;
  currency: string;
  completedPayRuns: number;
}
