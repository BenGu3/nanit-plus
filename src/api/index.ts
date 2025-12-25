import { authAPI } from './auth';
import { caresAPI } from './cares';

// Unified API interface that combines auth and cares
export const nanitAPI = {
  // Auth methods
  getToken: () => authAPI.getToken(),
  setToken: (token: string) => authAPI.setToken(token),
  clearToken: () => authAPI.clearToken(),
  login: (email: string, password: string) => authAPI.login(email, password),
  verifyMFA: (
    email: string,
    password: string,
    mfaToken: string,
    mfaCode: string,
    channel: string,
  ) => authAPI.verifyMFA(email, password, mfaToken, mfaCode, channel),

  // Cares methods
  getBabies: () => caresAPI.getBabies(),
  getCalendar: (babyUid: string, start: number, end: number) =>
    caresAPI.getCalendar(babyUid, start, end),
};

// Re-export types
export * from './types';
