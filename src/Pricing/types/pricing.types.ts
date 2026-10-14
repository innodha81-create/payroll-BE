export interface TargetCountryPrice {
  target_country_name: string;
  target_country_code?: string;
  amount: number | string;
}

export interface SavePricingPayload {
  root_country_name: string;
  root_country_code?: string;
  currency: string;
  currency_symbol?: string;
  prices: TargetCountryPrice[] | Record<string, string>;
  created_by?: string;
  updated_by?: string;
}

export interface PricingRecord {
  root_country_name: string;
  currency: string;
  prices: Record<string, string>;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RootPricingSummary {
  root_country_name: string;
  root_country_code?: string;
  currency: string;
  total_targets: number;
  prices: Record<string, string>;
  updated_at?: string;
}
