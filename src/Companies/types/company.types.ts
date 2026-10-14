export interface AddressInfo {
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface TaxComplianceInfo {
  pan?: string;
  gst?: string;
  uen?: string;
  companyType?: string;
}

export interface PlanDetails {
  operatingCountries?: string[];
  countryUserCounts?: Record<string, string>;
  countryAmounts?: Record<string, string>;
  includeOnboarding?: boolean;
  totalUsers?: number;
  grandTotal?: number;
}

export interface CompanyAdminInfo {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  logo?: string | null;
  plan: string;
  users: number;
  status: 'Active' | 'Inactive';
  address_info: AddressInfo;
  tax_compliance_info: TaxComplianceInfo;
  plan_details: PlanDetails;
  admin?: CompanyAdminInfo;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyDto {
  name: string;
  email: string;
  phone?: string;
  country: string;
  logo?: string | null;
  plan?: string;
  users?: number;
  status?: 'Active' | 'Inactive';
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gst?: string;
  uen?: string;
  companyType?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  operatingCountries?: string[];
  countryUserCounts?: Record<string, string>;
  countryAmounts?: Record<string, string>;
  includeOnboarding?: boolean;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {
  id?: string;
}
