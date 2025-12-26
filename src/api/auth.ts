import type { LoginResponse } from './types';

export class AuthAPI {
  private token: string | null = null;
  private refreshToken: string | null = null;

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('nanit_token');
    }
    return this.token;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('nanit_refresh_token');
    }
    return this.refreshToken;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('nanit_token', token);
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    localStorage.setItem('nanit_refresh_token', refreshToken);
  }

  clearToken() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('nanit_token');
    localStorage.removeItem('nanit_refresh_token');
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

    if (data.refresh_token) {
      this.setRefreshToken(data.refresh_token);
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

    if (data.refresh_token) {
      this.setRefreshToken(data.refresh_token);
    }

    return data;
  }

  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getToken();

    if (!refreshToken || !accessToken) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        // If refresh fails, clear tokens so user has to log in again
        this.clearToken();
        return false;
      }

      const data = await response.json();
      const token = data.access_token || data.token;

      if (!token) {
        this.clearToken();
        return false;
      }

      this.setToken(token);

      // Update refresh token if a new one is provided
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }

      return true;
    } catch (_error) {
      this.clearToken();
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
