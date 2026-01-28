export interface Customer {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  role?: 'customer' | 'reseller';
  status: string;
  created_at: string;
  subscription_plan_id?: number;
  subscription_expires_at?: string;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: number;
  uuid: string;
  name: string;
  price: number | string;
  reseller_price: number | string;
  duration: number;
  device_limit: number;
  platform_access: string[];
  features?: string[];
  description: string;
  status: string;
  is_popular?: boolean;
  show_to?: 'customer' | 'reseller' | 'both';
  created_at: string;
}

export type ViewMode = 'OTT' | 'Classic';

export interface User {
  uuid: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: Customer | User;
}

export interface Channel {
  id?: number;
  uuid: string;
  name: string;
  is_premium?: boolean;
  channel_number?: number;
  logo_url?: string;
  thumbnail_url?: string;
  stream_url?: string;
  category?: Category;
  language?: Language;
  ratings_avg_rating?: string | number;
  average_rating?: string | number; // Alias
  viewers_count_formatted?: string;
  daily_views_formatted?: string;
  daily_views?: number;
  user_rating?: number;
  hls_url?: string;
  village?: string;
  state_id?: number;
  language_id?: number;
  category_id?: number;
  district_id?: number;
  viewers_count?: number;
  expiry_at?: string;
  status?: string;
  created_at?: string;
  state?: State;
  district?: District;
  total_ratings?: number;
  is_featured?: boolean | number;
}


export interface State {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export interface District {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export interface Language {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  slug: string;
}

export interface Comment {
  id: number;
  uuid: string;
  channel_id: number;
  customer_id: number;
  comment: string;
  status: string;
  created_at: string;
  customer?: Customer;
}

export interface Rating {
  average: number;
  total: number;
  breakdown: {
    [key: number]: number;
  };
}

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  errors?: any;
}
