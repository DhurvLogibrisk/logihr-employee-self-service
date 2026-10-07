import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/common.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pin } = await req.json();

    if (!pin) {
      return new Response(JSON.stringify({ error: 'PIN required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let configuredPin = Deno.env.get('KIOSK_ADMIN_PIN');

    if (!configuredPin) {
      // Look up app_settings table in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: setting } = await supabaseAdmin
          .from('app_settings')
          .select('value')
          .eq('key', 'kiosk_admin_pin')
          .maybeSingle();

        if (setting && setting.value) {
          configuredPin = setting.value;
        }
      }
    }

    if (!configuredPin) {
      return new Response(
        JSON.stringify({ error: 'Kiosk admin PIN has not been configured by HR administrator.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isValid = pin.trim() === configuredPin.trim();
    if (isValid) {
      return new Response(JSON.stringify({ success: true, message: 'Kiosk Admin PIN verified' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid Kiosk Admin PIN' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
