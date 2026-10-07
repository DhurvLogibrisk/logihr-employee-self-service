import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getAuthoritativeISTTime } from '../_shared/common.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let employeeInfo = {
      name: 'Employee',
      empCode: '',
      designation: '',
      department: '',
      balances: 'CL: 0, SL: 0, EL: 0',
    };

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        const { data: empData } = await supabaseAdmin
          .from('employees')
          .select('id, name, emp_code, designation, department')
          .eq('auth_user_id', userData.user.id)
          .maybeSingle();

        if (empData) {
          employeeInfo.name = empData.name;
          employeeInfo.empCode = empData.emp_code;
          employeeInfo.designation = empData.designation;
          employeeInfo.department = empData.department;

          const { data: balances } = await supabaseAdmin
            .from('leave_balances')
            .select('leave_code, balance')
            .eq('employee_id', empData.id);

          if (balances && balances.length > 0) {
            employeeInfo.balances = balances.map((b: any) => `${b.leave_code}: ${b.balance}`).join(', ');
          }
        }
      }
    }

    const { query, language, userContext } = await req.json();
    const serverTime = getAuthoritativeISTTime();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const effectiveName = userContext?.name || employeeInfo.name;
    const effectiveEmpCode = userContext?.empCode || employeeInfo.empCode;
    const effectiveDepartment = userContext?.department || employeeInfo.department;

    if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
      const systemInstruction = `You are LogiHR AI Assistant for LogiBrisk Technologies (Surat HQ, IST).
Current Server Time: ${serverTime.timeFormattedIST} IST.
Employee: ${effectiveName} (${effectiveEmpCode || 'Active Employee'}, Department: ${effectiveDepartment || 'General'}).
Leave Balances: ${employeeInfo.balances}.
Languages: English, Gujarati (ગુજરાતી), Hindi (हिन्दी).
If asked to draft a timesheet, reply politely and output a JSON block with { "actionType": "DRAFT_TIMESHEET", "rows": [...] }.
If asked to apply leave, reply politely and output JSON with { "actionType": "PREFILL_LEAVE", "leaveType": "...", ... }.
Safety: You prepare drafts only.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${query}` }] },
            ],
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const candidateText =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        let proposal: any = undefined;
        const jsonMatch = candidateText.match(/```json\s*([\s\S]*?)\s*```/);
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
            // json parse fallback
          }
        }

        const cleanText = candidateText.replace(/```json[\s\S]*?```/g, '').trim();

        return new Response(
          JSON.stringify({
            text: cleanText || candidateText,
            proposal,
            serverTimeIST: serverTime.timeFormattedIST,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Fallback response
    const qLower = (query || '').toLowerCase();
    let text = `Hello ${effectiveName} from LogiHR Assistant. Current time is ${serverTime.timeFormattedIST} IST.`;
    if (qLower.includes('timesheet') || qLower.includes('bhari')) {
      text =
        language === 'gu'
          ? 'મેં તમારી ટાઇમશીટ તૈયાર કરી છે. કૃપા કરીને ટાઇમશીટ ટેબમાં ચકાસીને સેવ કરો.'
          : 'I can assist you in logging your daily timesheet tasks.';
    } else if (qLower.includes('leave') || qLower.includes('cl') || qLower.includes('chhutti')) {
      text =
        language === 'gu'
          ? `તમારા ખાતામાં બાકી રજાઓ: ${employeeInfo.balances}.`
          : `Your current leave balance: ${employeeInfo.balances}.`;
    }

    return new Response(
      JSON.stringify({
        text,
        serverTimeIST: serverTime.timeFormattedIST,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
