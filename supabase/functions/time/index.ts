import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, getAuthoritativeISTTime } from '../_shared/common.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const time = getAuthoritativeISTTime();

  return new Response(
    JSON.stringify({
      serverTimeIST: time.timeFormattedIST,
      epochMs: time.epochMs,
      timezone: time.timezone,
      offsetMinutes: time.offsetMinutes,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
});
