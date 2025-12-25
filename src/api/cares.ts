import { authAPI } from './auth';
import type { BabiesResponse, CalendarResponse } from './types';

export class CaresAPI {
  async getBabies(): Promise<BabiesResponse> {
    const token = authAPI.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/babies', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      authAPI.clearToken();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch babies');
    }

    return response.json();
  }

  async getCalendar(babyUid: string, start: number, end: number): Promise<CalendarResponse> {
    const token = authAPI.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/calendar/${babyUid}?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      authAPI.clearToken();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch calendar');
    }

    return response.json();
  }
}

export const caresAPI = new CaresAPI();
