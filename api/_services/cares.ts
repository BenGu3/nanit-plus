import * as nanitAPI from './nanit-api.js';

export async function handleGetBabies(token: string) {
  if (!token) {
    return {
      data: { error: 'Unauthorized' },
      status: 401,
    };
  }

  try {
    const result = await nanitAPI.getBabies(token);
    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return {
        data: { error: 'Session expired' },
        status: 401,
      };
    }
    return {
      data: { error: 'Failed to fetch babies' },
      status: 500,
    };
  }
}

export async function handleGetCalendar(
  token: string,
  babyUid: string,
  start: number,
  end: number,
) {
  if (!token) {
    return {
      data: { error: 'Unauthorized' },
      status: 401,
    };
  }

  if (!start || !end) {
    return {
      data: { error: 'Missing start or end time' },
      status: 400,
    };
  }

  try {
    const result = await nanitAPI.getCalendar(token, babyUid, start, end);
    return {
      data: result,
      status: 200,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return {
        data: { error: 'Session expired' },
        status: 401,
      };
    }
    return {
      data: { error: 'Failed to fetch calendar' },
      status: 500,
    };
  }
}
