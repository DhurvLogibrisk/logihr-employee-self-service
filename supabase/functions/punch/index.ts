import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getAuthoritativeISTTime, calculateHaversineMeters } from '../_shared/common.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate user from JWT token
    let employeeId: string | null = null;
    let employeeName: string = '';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user) {
        // Look up employee record matching auth_user_id
        const { data: empData } = await supabaseAdmin
          .from('employees')
          .select('id, name, is_active')
          .eq('auth_user_id', userData.user.id)
          .maybeSingle();

        if (empData) {
          if (!empData.is_active) {
            return new Response(
              JSON.stringify({ error: 'Employee account is deactivated.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            );
          }
          employeeId = empData.id;
          employeeName = empData.name;
        }
      }
    }

    const body = await req.json();

    // STRICT ANTI-TAMPER CHECK: Reject any client timestamp
    if (body.timestamp || body.time || body.clientTime || body.serverTime) {
      return new Response(
        JSON.stringify({
          error: 'SECURITY VIOLATION: Client timestamps are strictly forbidden. Punch timestamp is authoritative server-side only.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // If not authenticated via JWT, check for kiosk-authenticated payload or reject
    if (!employeeId) {
      if (body.employeeId) {
        // Look up if valid active employee
        const { data: empData } = await supabaseAdmin
          .from('employees')
          .select('id, name, is_active')
          .eq('id', body.employeeId)
          .maybeSingle();

        if (empData && empData.is_active) {
          employeeId = empData.id;
          employeeName = empData.name;
        }
      }
    }

    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. No valid employee profile found.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { type, workMode, latitude, longitude, accuracy, deviceId, selfieUrl } = body;

    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'Valid GPS coordinates required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 2. Fetch active geofence sites from Supabase Database
    const { data: dbSites } = await supabaseAdmin
      .from('geofence_sites')
      .select('id, name, latitude, longitude, radius_meters')
      .eq('is_active', true);

    const activeSites = dbSites && dbSites.length > 0 ? dbSites : [
      { id: 'site-surat-hq', name: 'LogiBrisk HQ (Surat)', latitude: 21.170240, longitude: 72.831061, radius_meters: 250 },
      { id: 'site-ahmedabad-hub', name: 'Ahmedabad Tech Hub', latitude: 23.022505, longitude: 72.571362, radius_meters: 200 },
      { id: 'site-mumbai-client', name: 'BKC Client Office (Mumbai)', latitude: 19.065714, longitude: 72.868725, radius_meters: 150 },
    ];

    // 3. Geofence evaluation
    let nearestSite = activeSites[0];
    let minDistance = calculateHaversineMeters(latitude, longitude, nearestSite.latitude, nearestSite.longitude);

    for (const site of activeSites) {
      const d = calculateHaversineMeters(latitude, longitude, site.latitude, site.longitude);
      if (d < minDistance) {
        minDistance = d;
        nearestSite = site;
      }
    }

    const isWithinGeofence = minDistance <= nearestSite.radius_meters;
    const serverTime = getAuthoritativeISTTime();

    // 4. Construct authoritative punch record
    const punchRecord = {
      employee_id: employeeId,
      type: type || 'IN',
      work_mode: workMode || 'OFFICE',
      server_timestamp: serverTime.isoUtc,
      punch_date_ist: serverTime.dateIST,
      site_id: nearestSite.id,
      site_name: workMode === 'OFFICE' ? nearestSite.name : workMode === 'WFH' ? 'Home (WFH Mode)' : 'Client On-Duty Site',
      latitude,
      longitude,
      accuracy: accuracy || 10,
      distance_meters: Math.round(minDistance),
      is_within_geofence: workMode === 'OFFICE' ? isWithinGeofence : true,
      device_id: deviceId || 'DEVICE-BOUND',
      selfie_url: selfieUrl || null,
      mock_detected: false,
    };

    // 5. INSERT punch record into Database
    const { data: insertedPunch, error: insertError } = await supabaseAdmin
      .from('punches')
      .insert(punchRecord)
      .select('*')
      .single();

    if (insertError) {
      console.error('Punch DB insertion error:', insertError);
      return new Response(
        JSON.stringify({ error: `Database punch insertion failed: ${insertError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        punch: {
          ...insertedPunch,
          serverTimeFormattedIST: serverTime.timeFormattedIST,
          epochMs: serverTime.epochMs,
          employeeName,
        },
        message: `Authoritative punch stamped at ${serverTime.timeFormattedIST} IST.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal punch processing error.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
