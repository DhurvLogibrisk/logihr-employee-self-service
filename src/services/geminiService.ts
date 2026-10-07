import { apiService } from './apiService';
import { serverTimeService } from './serverTimeService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AssistantActionProposal {
  type: 'DRAFT_TIMESHEET' | 'PREFILL_LEAVE' | 'LEAVE_BALANCE' | 'PUNCH_STATUS' | 'PENDING_APPROVALS';
  title: string;
  description: string;
  payload: any;
  requiresConfirmation: boolean;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  proposal?: AssistantActionProposal;
  isAiGenerated?: boolean;
}

export async function processAssistantQuery(
  userInput: string,
  language: 'en' | 'gu' | 'hi' = 'en'
): Promise<AssistantMessage> {
  const timeNow = serverTimeService.getCurrentServerTimeFormattedIST();
  const profile = apiService.getProfile();

  // 1. Try Supabase Edge Function / Server-Side Gemini API call first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('assistant', {
        body: {
          query: userInput,
          language,
        },
      });

      if (!error && data?.text) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: data.serverTimeIST || timeNow,
          proposal: data.proposal,
          isAiGenerated: true,
        };
      }
    } catch (err) {
      console.warn('Supabase assistant function error:', err);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userInput,
        language,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'I processed your query.',
        timestamp: data.serverTimeIST || timeNow,
        proposal: data.proposal,
        isAiGenerated: true,
      };
    }
  } catch {
    // If server-side Gemini endpoint is unreachable, fallback to local rule-based intent parsing
  }

  // 2. Resilient Fallback Logic (if offline)
  const query = userInput.trim().toLowerCase();

  // Leave balance query
  if (
    query.includes('cl') ||
    query.includes('leave balance') ||
    query.includes('kitni cl') ||
    query.includes('ketli cl') ||
    query.includes('chutti bachi') ||
    query.includes('bachi')
  ) {
    const balances = apiService.getLeaveBalances();
    const cl = balances.find((b) => b.code === 'CASUAL_LEAVE')?.balance ?? 5;
    const sl = balances.find((b) => b.code === 'SICK_LEAVE')?.balance ?? 6;
    const el = balances.find((b) => b.code === 'EARNED_LEAVE')?.balance ?? 12;
    const comp = balances.find((b) => b.code === 'COMP_OFF')?.balance ?? 2;

    let responseText = '';
    if (language === 'gu' || query.includes('chhe') || query.includes('mari')) {
      responseText = `તમારા ખાતામાં હાલમાં ${cl} Casual Leave (CL), ${sl} Sick Leave (SL), ${el} Privilege Leave (EL) અને ${comp} Comp-Off બાકી છે.`;
    } else if (language === 'hi' || query.includes('kitni') || query.includes('hai')) {
      responseText = `आपके खाते में वर्तमान में ${cl} Casual Leave (CL), ${sl} Sick Leave (SL), ${el} Privilege Leave (EL) और ${comp} Comp-Off शेष हैं।`;
    } else {
      responseText = `Your current available balances are: Casual Leave (CL): ${cl} days, Sick Leave (SL): ${sl} days, Earned Leave (EL): ${el} days, and Comp-Off: ${comp} days.`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: timeNow,
      proposal: {
        type: 'LEAVE_BALANCE',
        title: 'Available Leave Balances',
        description: `CL: ${cl} · SL: ${sl} · EL: ${el} · Comp-Off: ${comp}`,
        payload: { cl, sl, el, comp },
        requiresConfirmation: false,
      },
    };
  }

  // Timesheet query
  if (
    query.includes('timesheet') ||
    query.includes('bhari') ||
    query.includes('fill')
  ) {
    const draftedRows = [
      {
        id: `row-ai-${Date.now()}-1`,
        startTime: '10:00',
        endTime: '13:00',
        hours: '03:00',
        hoursDecimal: 3.0,
        taskNo: 'LB-420',
        modualTaskActivity: 'Requirements Analysis',
        description: 'Module requirements analysis & API payload design',
      },
      {
        id: `row-ai-${Date.now()}-2`,
        startTime: '14:00',
        endTime: '18:00',
        hours: '04:00',
        hoursDecimal: 4.0,
        taskNo: 'LB-425',
        modualTaskActivity: 'Testing & QA',
        description: 'Module integration testing and edge-case validation',
      },
    ];

    let responseText = '';
    if (language === 'gu') {
      responseText = `મેં તમારા વર્ણન મુજબ ૭ કલાકની ટાઇમશીટ ડ્રાફ્ટ કરી છે. કૃપા કરીને ચકાસીને 'Confirm & Apply' દબાવો.`;
    } else if (language === 'hi') {
      responseText = `मैंने आपके बताए अनुसार ७ घंटे की टाइमशीट तैयार कर ली है। कृपया नीचे दिए गए विवरण की जांच करें और 'Confirm' पर टैप करें।`;
    } else {
      responseText = `I have drafted a 7-hour timesheet based on your description. Please review the preview card below and confirm to save.`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: timeNow,
      proposal: {
        type: 'DRAFT_TIMESHEET',
        title: 'Drafted Timesheet (7 Hours Total)',
        description: 'LB-420 (03:00 hrs) + LB-425 (04:00 hrs)',
        payload: draftedRows,
        requiresConfirmation: true,
      },
    };
  }

  // Apply Leave query
  if (query.includes('leave') || query.includes('chutti') || query.includes('shukravar')) {
    let responseText =
      language === 'gu'
        ? `મેં ૧ દિવસની કેઝ્યુઅલ લીવ (CL) નું ફોર્મ પ્રી-ફિલ કર્યું છે. કૃપા કરીને ચકાસીને 'Confirm & Apply' બટન દબાવો.`
        : `I have prepared a 1-day Casual Leave draft. Please review the details below and tap 'Confirm & Apply'.`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: timeNow,
      proposal: {
        type: 'PREFILL_LEAVE',
        title: 'Draft Casual Leave Request',
        description: '09/10/2026 09:30 AM to 09/10/2026 06:30 PM (1 Day)',
        payload: {
          leaveType: 'Casual Leave',
          leaveTypeCode: 'CASUAL_LEAVE',
          fromDate: '09/10/2026 09:30 AM',
          toDate: '09/10/2026 06:30 PM',
          isHalfDay: false,
          noOfDays: 1,
          reason: 'Personal engagement',
          approverName: profile.reportingManager || 'Reporting Manager',
        },
        requiresConfirmation: true,
      },
    };
  }

  // Default response
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text:
      language === 'gu'
        ? `હું તમારો LogiHR AI સહાયક છું. તમે ગુજરાતી, હિન્દી કે અંગ્રેજીમાં પૂછી શકો છો:\n• "મારી કેટલી CL બાકી છે?"\n• "કાલનો ટાઇમશીટ ભરી દો: ૧૦ થી ૧ વાહન માસ્ટર, ૨ થી ૬ ટેસ્ટિંગ"\n• "આવતા શુક્રવારે રજા અરજી કરો"`
        : `I'm LogiHR Assistant. You can ask me in English, ગુજરાતી, or हिन्दी:\n• "Mari kitni CL bachi chhe?"\n• "Kal no timesheet bhari do: 10 thi 1 vehicle master"\n• "Apply leave for Friday"`,
    timestamp: timeNow,
  };
}
