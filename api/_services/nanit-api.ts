const NANIT_API = 'https://api.nanit.com';

export async function nanitFetch(path: string, token?: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `token ${token}`);
  }
  headers.set('Accept', 'application/json');
  headers.set('nanit-api-version', '1');

  const response = await fetch(`${NANIT_API}${path}`, {
    ...options,
    headers,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const data = await response.json();

  // HTTP 482 is MFA required - not an error, return the data
  if (response.status === 482) {
    return data;
  }

  if (!response.ok) {
    throw new Error(`Nanit API error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

export async function login(email: string, password: string) {
  return nanitFetch('/login', undefined, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Nanit/6.0.0 (iOS; iPhone; Scale/2.00)',
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyMFA(
  email: string,
  password: string,
  mfaToken: string,
  mfaCode: string,
  channel: string,
) {
  return nanitFetch('/login', undefined, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Nanit/6.0.0 (iOS; iPhone; Scale/2.00)',
    },
    body: JSON.stringify({
      mfa_token: mfaToken,
      channel,
      mfa_code: mfaCode,
      password,
      email,
    }),
  });
}

export async function getBabies(token: string) {
  return nanitFetch('/babies', token);
}

export async function getCalendar(token: string, babyUid: string, start: number, end: number) {
  return nanitFetch(`/babies/${babyUid}/calendar?start=${start}&end=${end}`, token, {
    headers: {
      'X-Nanit-Platform': 'unknown',
      'X-Nanit-Service': '3.52.0 (882)',
    },
  });
}
