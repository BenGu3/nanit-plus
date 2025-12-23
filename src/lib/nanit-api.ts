const API_BASE = 'https://api.nanit.com';

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

export interface User {
  email: string;
  first_name?: string;
  last_name?: string;
}

export class NanitAPI {
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || null;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('nanit_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('nanit_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('nanit_token');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Nanit/6.0.0 (iOS; iPhone; Scale/2.00)',
        'nanit-api-version': '1',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // HTTP 482 = MFA required
    if (response.status === 482) {
      return data;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Check if we got a token directly (unlikely, but handle it)
    const token = data.access_token || data.token;
    if (token) {
      this.setToken(token);
      return data;
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
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Nanit/6.0.0 (iOS; iPhone; Scale/2.00)',
        'nanit-api-version': '1',
      },
      body: JSON.stringify({
        mfa_token: mfaToken,
        channel,
        mfa_code: mfaCode,
        password,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'MFA verification failed');
    }

    const token = data.access_token || data.token;
    if (!token) {
      throw new Error('No token received after MFA verification');
    }

    this.setToken(token);
    return data;
  }

  async getBabies(): Promise<BabiesResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}/babies`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/json',
        'nanit-api-version': '1',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error('Failed to fetch babies');
    }

    return response.json();
  }
}

export const nanitAPI = new NanitAPI();
