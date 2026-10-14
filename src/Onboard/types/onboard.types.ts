export interface OnboardFeeDetail {
  currency: string;
  amount: string;
  updated_at?: string;
}

export interface OnboardRecord {
  id?: string;
  country_name: string;
  currency: string;
  amount: string;
  updated_at?: string;
}

export interface SaveOnboardPayload {
  country_name: string;
  currency: string;
  amount: number | string;
  country_code?: string;
  currency_symbol?: string;
  created_by?: string;
  updated_by?: string;
}

export interface UpdateOnboardPayload {
  amount?: number | string;
  currency?: string;
  updated_by?: string;
}

