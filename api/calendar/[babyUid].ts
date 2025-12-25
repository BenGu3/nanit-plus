import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetCalendar } from '../_services/cares';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  const { babyUid } = req.query;
  const start = Number(req.query.start);
  const end = Number(req.query.end);

  if (!babyUid || typeof babyUid !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid babyUid' });
  }

  const { data, status } = await handleGetCalendar(token, babyUid, start, end);
  return res.status(status).json(data);
}
