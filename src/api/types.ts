export interface LoginResponse {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  mfa_token?: string;
  phone_suffix?: string;
  channel?: string;
  message?: string;
}

export interface Baby {
  uid: string;
  id: string;
  birthdate?: string;
  due_date?: string;
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
