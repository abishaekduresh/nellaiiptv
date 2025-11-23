export interface Customer {
  uuid: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
}

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
  id: number;
  uuid: string;
  name: string;
  channel_number: number;
  hls_url: string;
  village: string;
  state_id: number;
  language_id: number;
  district_id: number;
  thumbnail_url: string;
  viewers_count: number;
  expiry_at: string;
  status: string;
  created_at: string;
  state?: State;
  district?: District;
  language?: Language;
  average_rating?: number;
  total_ratings?: number;
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
