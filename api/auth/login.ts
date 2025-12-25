import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLogin } from '../_services/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    const { data, status } = await handleLogin(email, password);
    return res.status(status).json(data);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
