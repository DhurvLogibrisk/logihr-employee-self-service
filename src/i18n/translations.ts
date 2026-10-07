import { LanguageCode } from '../types';

export const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_attendance: 'Attendance',
    nav_timesheet: 'Timesheet',
    nav_leave: 'Leave',
    nav_approvals: 'Approvals',
    nav_profile: 'Profile',

    // Common
    save: 'Save',
    close: 'Close',
    cancel: 'Cancel',
    submit: 'Submit',
    approve: 'Approve',
    reject: 'Reject',
    status: 'Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    view_details: 'View Details',
    select_placeholder: '--SELECT--',

    // Attendance
    attendance_title: 'Today\'s Attendance',
    tamper_proof_ist: 'Tamper-proof IST',
    check_in: 'Check In',
    check_out: 'Check Out',
    break_in: 'Break In',
    break_out: 'Break Out',
    checked_in_at: 'Checked in at',
    not_punched: 'Not Punched Today',
    elapsed_time: 'Elapsed Work Time',
    geofence_status: 'Geofence Status',
    within_geofence: 'Inside Office Geofence',
    outside_geofence: 'Outside Geofence',
    registered_device: 'Registered Device',
    network_connection: 'Network Status',
    regularization_cta: 'Missed a punch? Apply for Regularization',
    wfh_on_duty_cta: 'Work From Home / On-Duty punch',
    clock_drift_warning: 'Warning: Device clock differs from authoritative IST server time by > 2 minutes. Server timestamp will be enforced.',
    offline_sync_badge: 'Offline punch queued. Will sync securely when reconnected.',

    // Leave
    add_leave: 'Add Leave',
    my_leave: 'My Leave',
    employee_name_label: 'Employee Name*',
    leave_type_label: 'Leave Type*',
    from_date_label: 'From Date*',
    to_date_label: 'To Date*',
    is_half_day_label: 'Is Half Day',
    no_of_days_label: 'No Of Days',
    reason_label: 'Reason*',
    approvers_name_label: 'Approvers Name*',
    available_balance: 'Available Balance',

    // Timesheet
    add_timesheet: 'Add Time Sheet',
    timesheet_date_label: 'TimeSheet Date',
    add_detail_time: '+ ADD DETAIL TIME',
    timesheet_tip: 'Tip: Enter start/end time, pick activity, and press Enter in description to add next row quickly.',
    start_time: 'START TIME',
    end_time: 'END TIME',
    hours: 'HOURS',
    task_no: 'TASK NO',
    modual_task_activity: 'MODUAL TASK ACTIVITY',
    description: 'DESCRIPTION',
    action: 'ACTION',
    total_hours: 'Total Hours',
    copy_yesterday: 'Copy Yesterday',
    recent_tasks: 'Recent Tasks',

    // Approvals
    pending_approvals: 'Pending Approvals',
    bulk_approve: 'Bulk Approve',
    team_today: 'Team Attendance Today',

    // AI Assistant
    ai_assistant_title: 'LogiHR AI Assistant',
    ai_placeholder: 'Ask in English, ગુજરાતી, or हिन्दी...',
    ai_disclaimer: 'LogiHR AI can assist with drafting timesheets & checking balances. Confirmation required for actions.',

    // Settings
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    biometric_lock: 'Biometric Lock (Face ID / Fingerprint)',
    smart_reminders: 'Smart Reminders',
    server_time_sync: 'IST Server Sync Status',
  },
  gu: {
    // Nav
    nav_home: 'હોમ',
    nav_attendance: 'હાજરી',
    nav_timesheet: 'ટાઇમશીટ',
    nav_leave: 'રજા',
    nav_approvals: 'મંજૂરીઓ',
    nav_profile: 'પ્રોફાઇલ',

    // Common
    save: 'સાચવો',
    close: 'બંધ કરો',
    cancel: 'રદ કરો',
    submit: 'સબમિટ કરો',
    approve: 'મંજૂર કરો',
    reject: 'નામંજૂર કરો',
    status: 'સ્થિતિ',
    pending: 'બાકી',
    approved: 'મંજૂર',
    rejected: 'નામંજૂર',
    view_details: 'વિગતો જુઓ',
    select_placeholder: '--પસંદ કરો--',

    // Attendance
    attendance_title: 'આજની હાજરી',
    tamper_proof_ist: 'ટેમ્પર-પ્રૂફ IST',
    check_in: 'ચેક ઇન',
    check_out: 'ચેક આઉટ',
    break_in: 'બ્રેક ઇન',
    break_out: 'બ્રેક આઉટ',
    checked_in_at: 'ચેક ઇન સમય',
    not_punched: 'આજે હાજરી પુરાઈ નથી',
    elapsed_time: 'કામનો વીતેલો સમય',
    geofence_status: 'જિયોફેન્સ સ્થિતિ',
    within_geofence: 'ઓફિસ જિયોફેન્સની અંદર',
    outside_geofence: 'જિયોફેન્સ બહાર',
    registered_device: 'નોંધાયેલ ઉપકરણ',
    network_connection: 'નેટવર્ક સ્થિતિ',
    regularization_cta: 'પંચ ચૂકી ગયા? રેગ્યુલરાઇઝેશન અરજી કરો',
    wfh_on_duty_cta: 'વર્ક ફ્રોમ હોમ / ઓન-ડ્યુટી પંચ',
    clock_drift_warning: 'ચેતવણી: તમારા ઉપકરણનો સમય સર્વર સમયથી ૨ મિનિટથી વધુ અલગ છે.',
    offline_sync_badge: 'ઑફલાઇન પંચ કતારમાં છે. નેટવર્ક આવતા જ સિંક થશે.',

    // Leave
    add_leave: 'રજા ઉમેરો (Add Leave)',
    my_leave: 'મારી રજાઓ',
    employee_name_label: 'કર્મચારીનું નામ*',
    leave_type_label: 'રજાનો પ્રકાર*',
    from_date_label: 'તારીખથી*',
    to_date_label: 'તારીખ સુધી*',
    is_half_day_label: 'અડધો દિવસ છે',
    no_of_days_label: 'દિવસોની સંખ્યા',
    reason_label: 'કારણ*',
    approvers_name_label: 'મંજૂરકર્તાનું નામ*',
    available_balance: 'ઉપલબ્ધ બેલેન્સ',

    // Timesheet
    add_timesheet: 'ટાઇમ શીટ ઉમેરો (Add Time Sheet)',
    timesheet_date_label: 'TimeSheet Date',
    add_detail_time: '+ ADD DETAIL TIME',
    timesheet_tip: 'ટિપ: સમય નાખો, પ્રવૃત્તિ પસંદ કરો અને આગળની હરોળ માટે વર્ણનમાં Enter દબાવો.',
    start_time: 'START TIME',
    end_time: 'END TIME',
    hours: 'HOURS',
    task_no: 'TASK NO',
    modual_task_activity: 'MODUAL TASK ACTIVITY',
    description: 'DESCRIPTION',
    action: 'ACTION',
    total_hours: 'કુલ કલાકો',
    copy_yesterday: 'ગઈકાલનું કોપી કરો',
    recent_tasks: 'તાજેતરના કાર્યો',

    // Approvals
    pending_approvals: 'બાકી મંજૂરીઓ',
    bulk_approve: 'સામૂહિક મંજૂર',
    team_today: 'આજે ટીમની હાજરી',

    // AI Assistant
    ai_assistant_title: 'LogiHR AI સહાયક',
    ai_placeholder: 'ગુજરાતી, હિન્દી કે અંગ્રેજીમાં પૂછો...',
    ai_disclaimer: 'AI સહાયક ડ્રાફ્ટ કરી શકે છે. કોઈપણ કાર્ય માટે તમારી મંજૂરી જરૂરી છે.',

    // Settings
    settings: 'સેટિંગ્સ',
    language: 'ભાષા',
    theme: 'થીમ',
    biometric_lock: 'બાયોમેટ્રિક લૉક (Face ID / ફિંગરપ્રિન્ટ)',
    smart_reminders: 'સ્માર્ટ રીમાઇન્ડર્સ',
    server_time_sync: 'IST સર્વર સિંક સ્થિતિ',
  },
  hi: {
    // Nav
    nav_home: 'होम',
    nav_attendance: 'उपस्थिति',
    nav_timesheet: 'टाइमशीट',
    nav_leave: 'छुट्टी',
    nav_approvals: 'अनुमोदन',
    nav_profile: 'प्रोफ़ाइल',

    // Common
    save: 'सहेजें',
    close: 'बंद करें',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    approve: 'स्वीकृत करें',
    reject: 'अस्वीकृत करें',
    status: 'स्थिति',
    pending: 'लंबित',
    approved: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    view_details: 'विवरण देखें',
    select_placeholder: '--चुनें--',

    // Attendance
    attendance_title: 'आज की उपस्थिति',
    tamper_proof_ist: 'छेड़छाड़-मुक्त IST',
    check_in: 'चेक इन',
    check_out: 'चेक आउट',
    break_in: 'ब्रेक इन',
    break_out: 'ब्रेक आउट',
    checked_in_at: 'चेक इन समय',
    not_punched: 'आज पंच नहीं किया गया',
    elapsed_time: 'काम का बीता समय',
    geofence_status: 'जियोफेंस स्थिति',
    within_geofence: 'कार्यालय जियोफेंस के अंदर',
    outside_geofence: 'जियोफेंस के बाहर',
    registered_device: 'पंजीकृत डिवाइस',
    network_connection: 'नेटवर्क स्थिति',
    regularization_cta: 'पंच छूट गया? नियमितीकरण के लिए आवेदन करें',
    wfh_on_duty_cta: 'वर्क फ्रॉम होम / ऑन-ड्यूटी पंच',
    clock_drift_warning: 'चेतावनी: डिवाइस का समय सर्वर IST समय से २ मिनट से अधिक भिन्न है।',
    offline_sync_badge: 'ऑफ़लाइन पंच कतारबद्ध है। नेटवर्क आते ही सिंक होगा।',

    // Leave
    add_leave: 'छुट्टी जोड़ें (Add Leave)',
    my_leave: 'मेरी छुट्टियां',
    employee_name_label: 'कर्मचारी का नाम*',
    leave_type_label: 'छुट्टी का प्रकार*',
    from_date_label: 'आरंभ तिथि*',
    to_date_label: 'समाप्ति तिथि*',
    is_half_day_label: 'आधा दिन है',
    no_of_days_label: 'दिनों की संख्या',
    reason_label: 'कारण*',
    approvers_name_label: 'अनुमोदक का नाम*',
    available_balance: 'उपलब्ध शेष',

    // Timesheet
    add_timesheet: 'टाइम शीट जोड़ें (Add Time Sheet)',
    timesheet_date_label: 'TimeSheet Date',
    add_detail_time: '+ ADD DETAIL TIME',
    timesheet_tip: 'टिप: समय दर्ज करें, गतिविधि चुनें और विवरण में Enter दबाकर अगली पंक्ति जोड़ें।',
    start_time: 'START TIME',
    end_time: 'END TIME',
    hours: 'HOURS',
    task_no: 'TASK NO',
    modual_task_activity: 'MODUAL TASK ACTIVITY',
    description: 'DESCRIPTION',
    action: 'ACTION',
    total_hours: 'कुल घंटे',
    copy_yesterday: 'कल का कॉपी करें',
    recent_tasks: 'हाल के कार्य',

    // Approvals
    pending_approvals: 'लंबित अनुमोदन',
    bulk_approve: 'सामूहिक स्वीकृति',
    team_today: 'आज टीम की उपस्थिति',

    // AI Assistant
    ai_assistant_title: 'LogiHR AI सहायक',
    ai_placeholder: 'हिन्दी, गुजराती या अंग्रेज़ी में पूछें...',
    ai_disclaimer: 'AI सहायक ड्राफ्ट कर सकता है। किसी भी कार्य के लिए आपकी पुष्टि आवश्यक है।',

    // Settings
    settings: 'सेटिंग्स',
    language: 'भाषा',
    theme: 'थीम',
    biometric_lock: 'बायोमेट्रिक लॉक (Face ID / फिंगरप्रिंट)',
    smart_reminders: 'स्मार्ट रिमाइंडर',
    server_time_sync: 'IST सर्वर सिंक स्थिति',
  }
};

export type TranslationKey = keyof typeof translations['en'];

export function t(key: TranslationKey, lang: LanguageCode = 'en'): string {
  const langDict = translations[lang] || translations.en;
  return (langDict as any)[key] || translations.en[key] || key;
}
