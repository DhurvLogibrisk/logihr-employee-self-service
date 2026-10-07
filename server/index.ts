import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Strict CORS and Security headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * 1. Authoritative IST Server Time endpoint
 * Asia/Kolkata (UTC+05:30)
 */
app.get('/api/time', (req, res) => {
  const nowUtc = new Date();
  const serverTimeIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(nowUtc);

  res.json({
    serverTimeIST,
    epochMs: nowUtc.getTime(),
    timezone: 'Asia/Kolkata',
    offsetMinutes: 330,
  });
});

/**
 * 2. Authoritative Attendance Punch Endpoint
 * Rejects client-supplied timestamps; only server stamps time
 */
app.post('/api/attendance/punch', (req, res) => {
  const { type, workMode, latitude, longitude, accuracy, deviceId } = req.body;

  // Reject if client attempts to pass a timestamp
  if (req.body.timestamp || req.body.time || req.body.serverTime) {
    return res.status(400).json({
      error: 'SECURITY VIOLATION: Client timestamps are forbidden. Punch time is strictly stamped by the authoritative server.',
    });
  }

  const nowUtc = new Date();
  const serverTimeFormattedIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(nowUtc);

  res.json({
    success: true,
    punch: {
      id: `punch-srv-${Date.now()}`,
      type: type || 'IN',
      workMode: workMode || 'OFFICE',
      serverTimestampUtc: nowUtc.toISOString(),
      serverTimeFormattedIST,
      epochMs: nowUtc.getTime(),
      latitude,
      longitude,
      accuracy: accuracy || 10,
      deviceId: deviceId || 'DEV-PX8-9941',
    },
    message: `Authoritative punch stamped at ${serverTimeFormattedIST} IST.`,
  });
});

/**
 * 3. Health & Status
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LogiHR Enterprise Backend API' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`LogiHR API server running on port ${PORT}`);
  });
}

export default app;
