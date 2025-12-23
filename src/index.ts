import { serve } from 'bun';
import index from './index.html';
import * as nanit from './server/nanit';

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    '/*': index,

    // Auth endpoints
    '/api/auth/login': {
      async POST(req) {
        const { email, password } = await req.json();
        const result = await nanit.login(email, password);
        return Response.json(result);
      },
    },

    '/api/auth/verify-mfa': {
      async POST(req) {
        const { email, password, mfaToken, mfaCode, channel } = await req.json();
        const result = await nanit.verifyMFA(email, password, mfaToken, mfaCode, channel);
        return Response.json(result);
      },
    },

    // Data endpoints
    '/api/babies': {
      async GET(req) {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const result = await nanit.getBabies(token);
        return Response.json(result);
      },
    },

    '/api/calendar/:babyUid': {
      async GET(req) {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { babyUid } = req.params;
        const url = new URL(req.url);
        const start = Number(url.searchParams.get('start'));
        const end = Number(url.searchParams.get('end'));

        if (!start || !end) {
          return Response.json({ error: 'Missing start or end time' }, { status: 400 });
        }

        const result = await nanit.getCalendar(token, babyUid, start, end);
        return Response.json(result);
      },
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
