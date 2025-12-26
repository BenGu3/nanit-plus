import * as nanitAPI from './nanit-api.js';

export async function handleLogin(email: string, password: string) {
  const result = (await nanitAPI.login(email, password)) as {
    mfa_token?: string;
    [key: string]: unknown;
  };
  return {
    data: result,
    status: result.mfa_token ? 482 : 200,
  };
}

export async function handleVerifyMFA(
  email: string,
  password: string,
  mfaToken: string,
  mfaCode: string,
  channel: string,
) {
  const result = await nanitAPI.verifyMFA(email, password, mfaToken, mfaCode, channel);
  return {
    data: result,
    status: 200,
  };
}

export async function handleRefreshToken(accessToken: string, refreshToken: string) {
  const result = await nanitAPI.refreshToken(accessToken, refreshToken);
  return {
    data: result,
    status: 200,
  };
}
