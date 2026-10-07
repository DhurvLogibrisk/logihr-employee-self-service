import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Simple In-Memory Kiosk PIN Rate Limiter (Brute-Force Protection)
const pinAttemptMap = new Map<string, { count: number; resetAt: number }>();
function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = pinAttemptMap.get(ip);
  if (!entry || now > entry.resetAt) {
    pinAttemptMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minute window
    return true;
  }
  if (entry.count >= 5) {
    return false; // Max 5 failed attempts per 15 minutes
  }
  entry.count += 1;
  return true;
}

// Initialize Google GenAI on server side
let genAI: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    genAI = new GoogleGenAI();
  }
} catch (err) {
  console.warn('GoogleGenAI initialization warning:', err);
}

// Helper to get authoritative IST time
function getAuthoritativeIST() {
  const nowUtc = new Date();
  const timeFormattedIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(nowUtc);

  return {
    epochMs: nowUtc.getTime(),
    timeFormattedIST,
    isoUtc: nowUtc.toISOString(),
  };
}

// ==========================================
// AUTHORITATIVE API ROUTES
// ==========================================

// 1. Authoritative Server Time
app.get('/api/time', (_req, res) => {
  const time = getAuthoritativeIST();
  res.json({
    serverTimeIST: time.timeFormattedIST,
    epochMs: time.epochMs,
    timezone: 'Asia/Kolkata',
    offsetMinutes: 330,
  });
});

// 2. Kiosk Admin PIN Verification (Fail-Closed: strictly requires server KIOSK_ADMIN_PIN)
app.post('/api/kiosk/verify-pin', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  if (!checkPinRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many incorrect PIN attempts. Rate limit exceeded. Try again in 15 minutes.' });
  }

  const { pin } = req.body;
  const configuredPin = process.env.KIOSK_ADMIN_PIN;

  if (!configuredPin) {
    return res.status(500).json({ error: 'Kiosk admin PIN has not been configured by server administrator.' });
  }

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  if (pin.trim() === configuredPin.trim()) {
    return res.json({ success: true, message: 'Admin PIN verified.' });
  }

  return res.status(403).json({ error: 'Incorrect Kiosk Admin PIN.' });
});

// 3. Deprecated Legacy Endpoints (Disabled for security)
app.all(['/api/attendance/punch', '/api/punch', '/api/auth/login', '/api/auth/biometric'], (_req, res) => {
  res.status(403).json({
    error: 'SECURITY ENFORCEMENT: Legacy unauthenticated endpoints are disabled. Use Supabase Auth and Supabase Edge Functions with Bearer JWT.',
  });
});

// 4. Server-Side Gemini AI Assistant Proxy
app.post('/api/assistant/chat', async (req, res) => {
  const { query, language } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const serverTime = getAuthoritativeIST();

  if (genAI) {
    try {
      const systemInstruction = `You are the official LogiHR AI Assistant for LogiBrisk Technologies (Surat HQ, Gujarat, India).
Authoritative IST Server Time: ${serverTime.timeFormattedIST}.
Languages: Support Gujarati (ગુજરાતી), Hindi (हिन्दी), and English naturally based on user language.
If the user asks:
- To fill/draft a timesheet: Respond politely with confirmation, and at the end output a JSON block in \`\`\`json { "actionType": "DRAFT_TIMESHEET", "rows": [ ... ] } \`\`\`
- To apply leave: Respond politely with confirmation, and output JSON block \`\`\`json { "actionType": "PREFILL_LEAVE", "leaveType": "...", ... } \`\`\`
SAFETY: You are only preparing drafts. The user must explicitly tap confirm. Never modify punch time.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${query}` }] },
        ],
      });

      const responseText = response?.text || '';

      // Parse any action JSON block if Gemini generated one
      let proposal: any = undefined;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.actionType === 'DRAFT_TIMESHEET') {
            proposal = {
              type: 'DRAFT_TIMESHEET',
              title: 'Drafted Timesheet (via Gemini)',
              description: `${parsed.rows?.length || 2} rows generated`,
              payload: parsed.rows,
              requiresConfirmation: true,
            };
          } else if (parsed.actionType === 'PREFILL_LEAVE') {
            proposal = {
              type: 'PREFILL_LEAVE',
              title: 'Draft Leave Request (via Gemini)',
              description: `${parsed.leaveType} (${parsed.days || 1} Day)`,
              payload: parsed,
              requiresConfirmation: true,
            };
          }
        } catch {
          // parse fallback
        }
      }

      const cleanText = responseText.replace(/```json[\s\S]*?```/g, '').trim();

      return res.json({
        text: cleanText || responseText,
        proposal,
        serverTimeIST: serverTime.timeFormattedIST,
      });
    } catch (err: any) {
      console.warn('Gemini generateContent error:', err?.message);
    }
  }

  const qLower = query.toLowerCase();
  let text = `Hello from LogiHR Assistant. Current time is ${serverTime.timeFormattedIST} IST.`;
  if (qLower.includes('timesheet') || qLower.includes('bhari')) {
    text =
      language === 'gu'
        ? 'મેં ટાઇમશીટ તૈયાર કરી છે. કૃપા કરીને ટાઇમશીટ ટેબમાં ચકાસીને સેવ કરો.'
        : 'I have prepared a draft timesheet for you. Please review and confirm in the timesheet tab.';
  }

  res.json({
    text,
    serverTimeIST: serverTime.timeFormattedIST,
  });
});

// ==========================================
// VITE SPA INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LogiHR Full-Stack Server] running on http://localhost:${PORT} (IST Asia/Kolkata)`);
  });
}

startServer();
