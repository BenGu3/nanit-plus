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
  change_type?: 'pee' | 'mixed' | 'poop';
  feed_amount?: number;
}

export interface CalendarResponse {
  calendar: CalendarEvent[];
}

export class NanitAPI {
  private token: string | null = null;

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('nanit_token');
    }
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('nanit_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('nanit_token');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.status === 482 || data.mfa_token) {
      return data;
    }

    const token = data.access_token || data.token;
    if (token) {
      this.setToken(token);
    }

    return data;
  }

  async verifyMFA(
    email: string,
    password: string,
    mfaToken: string,
    mfaCode: string,
    channel: string,
  ): Promise<LoginResponse> {
    const response = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mfaToken, mfaCode, channel }),
    });

    if (!response.ok) {
      throw new Error('MFA verification failed');
    }

    const data = await response.json();
    const token = data.access_token || data.token;

    if (!token) {
      throw new Error('No token received');
    }

    this.setToken(token);
    return data;
  }

  async getBabies(): Promise<BabiesResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/babies', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch babies');
    }

    return response.json();
  }

  async getCalendar(babyUid: string, start: number, end: number): Promise<CalendarResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/calendar/${babyUid}?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch calendar');
    }

    return response.json();
  }
}

export const nanitAPI = new NanitAPI();
