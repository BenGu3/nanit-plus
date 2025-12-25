import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetBabies } from './_services/cares.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  const { data, status } = await handleGetBabies(token);
  return res.status(status).json(data);
}
