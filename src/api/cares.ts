import { authAPI } from './auth';
import type { BabiesResponse, CalendarResponse } from './types';

export class CaresAPI {
  private async fetchWithTokenRefresh(url: string, options: RequestInit = {}): Promise<Response> {
    const token = authAPI.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // First attempt with current token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      const refreshed = await authAPI.refreshAccessToken();

      if (!refreshed) {
        // Refresh failed, user needs to log in again
        throw new Error('Session expired');
      }

      // Retry the request with the new token
      const newToken = authAPI.getToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });

      // If still 401 after refresh, clear tokens and throw
      if (response.status === 401) {
        authAPI.clearToken();
        throw new Error('Session expired');
      }
    }

    return response;
  }

  async getBabies(): Promise<BabiesResponse> {
    const response = await this.fetchWithTokenRefresh('/api/babies');

    if (!response.ok) {
      throw new Error('Failed to fetch babies');
    }

    return response.json();
  }

  async getCalendar(babyUid: string, start: number, end: number): Promise<CalendarResponse> {
    const response = await this.fetchWithTokenRefresh(
      `/api/calendar/${babyUid}?start=${start}&end=${end}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar');
    }

    return response.json();
  }
}

export const caresAPI = new CaresAPI();
