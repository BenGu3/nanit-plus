import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRefreshToken } from '../_services/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refresh_token } = req.body;
    const authHeader = req.headers.authorization;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token' });
    }

    // Extract access token from Authorization header
    const accessToken = authHeader?.replace('Bearer ', '').replace('token ', '');

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    const { data, status } = await handleRefreshToken(accessToken, refresh_token);
    return res.status(status).json(data);
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
}
