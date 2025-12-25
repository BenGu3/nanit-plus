import { serve } from 'bun';
import * as authService from '../api/_services/auth';
import * as caresService from '../api/_services/cares';
import index from './index.html';

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    '/*': index,

    // Auth endpoints
    '/api/auth/login': {
      async POST(req) {
        const { email, password } = await req.json();
        const { data, status } = await authService.handleLogin(email, password);
        return Response.json(data, { status });
      },
    },

    '/api/auth/verify-mfa': {
      async POST(req) {
        const { email, password, mfaToken, mfaCode, channel } = await req.json();
        const { data, status } = await authService.handleVerifyMFA(
          email,
          password,
          mfaToken,
          mfaCode,
          channel,
        );
        return Response.json(data, { status });
      },
    },

    // Data endpoints
    '/api/babies': {
      async GET(req) {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
        const { data, status } = await caresService.handleGetBabies(token);
        return Response.json(data, { status });
      },
    },

    '/api/calendar/:babyUid': {
      async GET(req) {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
        const { babyUid } = req.params;
        const url = new URL(req.url);
        const start = Number(url.searchParams.get('start'));
        const end = Number(url.searchParams.get('end'));

        const { data, status } = await caresService.handleGetCalendar(token, babyUid, start, end);
        return Response.json(data, { status });
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
