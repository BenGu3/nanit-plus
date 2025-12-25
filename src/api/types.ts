export interface LoginResponse {
  access_token?: string;
  token?: string;
  mfa_token?: string;
  phone_suffix?: string;
  channel?: string;
  message?: string;
}

export interface Baby {
  uid: string;
  id: string;
  first_name: string;
  last_name?: string;
  birthday?: string;
}

export interface BabiesResponse {
  babies: Baby[];
}

export interface CalendarEvent {
  id: string;
  time: number;
  type: 'diaper_change' | 'bottle_feed' | string;
  change_type?: 'pee' | 'mixed' | 'poo';
  feed_amount?: number;
}

export interface CalendarResponse {
  calendar: CalendarEvent[];
}
