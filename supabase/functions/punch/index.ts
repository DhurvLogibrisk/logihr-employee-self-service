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

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Supabase service credentials missing.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate user strictly from Supabase JWT token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Missing or invalid Authorization header.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed. Invalid or expired session token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 2. Fetch employee profile linked to auth_user_id
    const { data: empData, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, name, is_active')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle();

    if (empError || !empData) {
      return new Response(
        JSON.stringify({ error: 'Access denied: No employee profile linked to authenticated user account.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (!empData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Employee account is currently deactivated.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const employeeId = empData.id;
    const employeeName = empData.name;

    const body = await req.json();

    // 3. STRICT ANTI-TAMPER CHECK: Reject any client timestamp
    if (body.timestamp || body.time || body.clientTime || body.serverTime) {
      return new Response(
        JSON.stringify({
          error: 'SECURITY VIOLATION: Client timestamps are strictly forbidden. Punch timestamp is authoritative server-side only.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { type, workMode, latitude, longitude, accuracy, deviceId, selfieUrl } = body;

    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Valid GPS numerical coordinates (latitude, longitude) are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 4. Fetch active geofence sites from Supabase Database (Fail Closed: NO hardcoded fallbacks)
    const { data: activeSites, error: sitesError } = await supabaseAdmin
      .from('geofence_sites')
      .select('id, name, latitude, longitude, radius_meters')
      .eq('is_active', true);

    if (sitesError || !activeSites || activeSites.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Geofence verification unavailable: No active sites configured in database.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 5. Server-side Geofence evaluation
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

    // 6. Construct authoritative punch record using trusted employeeId
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

    // 7. INSERT punch record into Database
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
