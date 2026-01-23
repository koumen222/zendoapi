import axios from 'axios';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4/graphql';

const getConfig = () => ({
  token: process.env.CLOUDFLARE_API_TOKEN,
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
});

const formatDateOnly = (date) => date.toISOString().split('T')[0];

const normalizeRange = ({ startDate, endDate }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date range');
  }
  if (start > end) {
    return { start: end, end: start };
  }
  return { start, end };
};

const runQuery = async (query, variables) => {
  const { token } = getConfig();
  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN is not set');
  }
  const response = await axios.post(
    CLOUDFLARE_API_URL,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  if (response.data?.errors?.length) {
    const message = response.data.errors.map((err) => err.message).join(' | ');
    throw new Error(message || 'Cloudflare API error');
  }

  return response.data?.data;
};

export const fetchDailyVisits = async ({ startDate, endDate }) => {
  const { zoneId } = getConfig();
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID is not set');
  }
  const { start, end } = normalizeRange({ startDate, endDate });
  const query = `
    query($zoneTag: String!, $start: Date!, $end: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(limit: 10000, filter: { date_geq: $start, date_leq: $end }) {
            dimensions {
              date
            }
            sum {
              requests
            }
          }
        }
      }
    }
  `;
  const data = await runQuery(query, {
    zoneTag: zoneId,
    start: formatDateOnly(start),
    end: formatDateOnly(end),
  });
  const groups = data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
  return groups.map((group) => {
    const bucketStart = new Date(`${group.dimensions.date}T00:00:00.000Z`);
    return {
      bucketStart,
      bucket: group.dimensions.date,
      count: group.sum?.requests || 0,
      source: 'daily',
      zoneId,
    };
  });
};

export const fetchMinuteVisits = async ({ startDate, endDate }) => {
  const { zoneId } = getConfig();
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID is not set');
  }
  const { start, end } = normalizeRange({ startDate, endDate });
  const query = `
    query($zoneTag: String!, $start: DateTime!, $end: DateTime!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1mGroups(limit: 10000, filter: { datetime_geq: $start, datetime_leq: $end }) {
            dimensions {
              datetimeMinute
            }
            sum {
              requests
            }
          }
        }
      }
    }
  `;
  const data = await runQuery(query, {
    zoneTag: zoneId,
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const groups = data?.viewer?.zones?.[0]?.httpRequests1mGroups || [];
  return groups.map((group) => {
    const bucketStart = new Date(group.dimensions.datetimeMinute);
    return {
      bucketStart,
      bucket: group.dimensions.datetimeMinute,
      count: group.sum?.requests || 0,
      source: 'minute',
      zoneId,
    };
  });
};
