export interface CountryRecord {
  id: string;
  name: string;
  code?: string | null;
  phone_code?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateCountryDTO {
  name: string;
  code?: string;
  phone_code?: string;
  created_by?: string;
  updated_by?: string;
}

export interface WorldCountryItem {
  code: string;
  name: string;
  phoneCode?: string;
}
