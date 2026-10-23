export interface SubcompanyRecord {
  id: string;
  parent_company_id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  logo: string | null;
  status: 'Active' | 'Inactive';
  address_info: {
    streetAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  tax_compliance_info: {
    uen?: string;
    companyType?: string;
    pan?: string;
    gst?: string;
  };
  admin_info: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateSubcompanyDto {
  parent_company_id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  logo?: string;
  status?: 'Active' | 'Inactive';
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  uen?: string;
  companyType?: string;
  pan?: string;
  gst?: string;
  firstName?: string;
  lastName?: string;
  adminEmail?: string;
  adminPhone?: string;
}

export interface UpdateSubcompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  logo?: string;
  status?: 'Active' | 'Inactive';
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  uen?: string;
  companyType?: string;
  pan?: string;
  gst?: string;
  firstName?: string;
  lastName?: string;
  adminEmail?: string;
  adminPhone?: string;
}
