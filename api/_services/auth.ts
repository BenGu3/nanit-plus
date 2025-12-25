import * as nanitAPI from './nanit-api';

export async function handleLogin(email: string, password: string) {
  const result = await nanitAPI.login(email, password);
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
