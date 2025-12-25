import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVerifyMFA } from '../_services/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, mfaToken, mfaCode, channel } = req.body;
    const { data, status } = await handleVerifyMFA(email, password, mfaToken, mfaCode, channel);
    return res.status(status).json(data);
  } catch (error) {
    console.error('MFA verification error:', error);
    return res.status(500).json({ error: 'MFA verification failed' });
  }
}
