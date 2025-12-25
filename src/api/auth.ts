import type { LoginResponse } from './types';

export class AuthAPI {
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
}

export const authAPI = new AuthAPI();
