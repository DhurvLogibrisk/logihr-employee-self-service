export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export type LanguageCode = 'en' | 'gu' | 'hi';

export interface EmployeeProfile {
  id: string;
  empCode: string;
  name: string;
  designation: string;
  department: string;
  reportingManager: string;
  reportingManagerId: string;
  workLocation: string;
  email: string;
  phone: string;
  joiningDate: string;
  shiftName: string;
  shiftHours: string;
  shiftStart?: string;
  assignedSites: string[];
  avatarUrl?: string;
  role: UserRole;
  isDeviceRegistered: boolean;
  registeredDeviceId: string;
  registeredDeviceModel: string;
  consentGivenAt?: string;
}

export type PunchType = 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
export type WorkMode = 'OFFICE' | 'WFH' | 'ON_DUTY';

export interface GeofenceSite {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  city: string;
}

export interface AttendancePunch {
  id: string;
  employeeId: string;
  type: PunchType;
  workMode: WorkMode;
  serverTimestampUtc: string;
  serverTimeFormattedIST: string;
  epochMs: number;
  siteId?: string;
  siteName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  isWithinGeofence: boolean;
  deviceId: string;
  deviceModel: string;
  networkType: 'WiFi' | 'Mobile Data' | 'Offline';
  selfieUrl?: string;
  offlineQueued: boolean;
  receivedLate: boolean;
  flags: {
    mockLocationDetected: boolean;
    clockDriftDetected: boolean;
    lateMark: boolean;
    earlyOut: boolean;
  };
}

export type DayStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF';

export interface AttendanceDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayType: 'Working day' | 'Weekly off' | 'Holiday' | 'On Leave';
  inTime?: string; // HH:MM AM/PM
  outTime?: string; // HH:MM AM/PM
  totalWorkMinutes: number;
  breakMinutes: number;
  status: DayStatus;
  punches: AttendancePunch[];
  regularizationId?: string;
  regularizationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isLate: boolean;
  isEarlyOut: boolean;
  overtimeMinutes: number;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  punchType: 'In' | 'Out' | 'Both';
  proposedInTime?: string;
  proposedOutTime?: string;
  reason: string;
  attachmentName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAtIST: string;
  managerComment?: string;
}

export type LeaveTypeCode = 
  | 'CASUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'EARNED_LEAVE'
  | 'COMP_OFF'
  | 'LEAVE_WITHOUT_PAY';

export interface LeaveBalance {
  code: LeaveTypeCode;
  name: string;
  shortCode: string;
  balance: number;
  used: number;
  total: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  leaveTypeCode: LeaveTypeCode;
  fromDate: string; // DD/MM/YYYY hh:mm A
  toDate: string; // DD/MM/YYYY hh:mm A
  isHalfDay: boolean;
  noOfDays: number;
  reason: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedDateIST: string;
  decisionDateIST?: string;
  managerComment?: string;
  attachmentName?: string;
}

export interface TimesheetRow {
  id: string;
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  hours: string; // HH:MM auto-calculated
  hoursDecimal: number;
  taskNo: string;
  modualTaskActivity: string;
  description: string;
}

export interface TimesheetDay {
  id: string;
  date: string; // YYYY-MM-DD
  rows: TimesheetRow[];
  totalHours: string; // HH:MM
  totalMinutes: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAtIST?: string;
  approvedAtIST?: string;
  managerComment?: string;
  attendanceDiffWarning?: boolean;
}

export interface ApprovalItem {
  id: string;
  type: 'LEAVE' | 'REGULARIZATION' | 'TIMESHEET' | 'WFH';
  requesterName: string;
  requesterEmpId: string;
  requesterAvatar?: string;
  title: string;
  subtitle: string;
  details: Record<string, any>;
  dateIST: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'ATTENDANCE' | 'LEAVE' | 'TIMESHEET' | 'APPROVAL' | 'ANNOUNCEMENT' | 'REMINDER';
  timestampIST: string;
  read: boolean;
  actionable?: boolean;
  approvalId?: string;
  actionUrl?: string;
}

export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  type: 'Gazetted' | 'Optional';
  isUpcoming: boolean;
}

export interface PayslipItem {
  id: string;
  month: string; // YYYY-MM
  monthName: string;
  year: number;
  grossSalary: number;
  netPay: number;
  deductions: number;
  pf: number;
  tax: number;
  paidDays: number;
  generatedDate: string;
  isLocked?: boolean;
  pdfUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  dateIST: string;
  category: 'Company' | 'Event' | 'Policy' | 'Celebration';
  pinned?: boolean;
}

export interface HelpdeskTicket {
  id: string;
  ticketNo: string;
  category: 'Payroll & Salary' | 'Attendance & Biometric' | 'Leave Balance' | 'IT & Hardware' | 'HR Policies';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAtIST: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  attachmentName?: string;
  resolutionNote?: string;
}

// Phase 2 Types
export interface ExpenseClaim {
  id: string;
  title: string;
  category: 'Travel' | 'Food & Meal' | 'Client Meeting' | 'Office Supplies' | 'Internet/Phone';
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REIMBURSED' | 'REJECTED';
  receiptUrl?: string;
  notes: string;
  submittedAtIST: string;
}

export interface TourRequest {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  advanceAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface HRLetterRequest {
  id: string;
  type: 'Salary Certificate' | 'Experience Letter' | 'Address Proof' | 'Employment Verification';
  purpose: string;
  requestDateIST: string;
  status: 'PENDING' | 'READY';
  downloadUrl?: string;
}

export interface TaxDocument {
  id: string;
  title: string;
  year: string;
  type: 'Form 16 Part A' | 'Form 16 Part B' | 'PF Statement' | 'Investment Proof Receipt';
  size: string;
  date: string;
}

export interface ShiftRosterItem {
  date: string;
  shiftName: string;
  timing: string;
  isOff: boolean;
  canSwap: boolean;
}

export interface LoanAdvanceItem {
  id: string;
  type: 'Personal Loan' | 'Salary Advance';
  amount: number;
  tenureMonths: number;
  monthlyEmi: number;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
  remainingAmount: number;
}

export interface DirectoryEmployee {
  id: string;
  empCode: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  managerName: string;
  status: 'Available' | 'On Leave' | 'In Meeting';
  avatar?: string;
}

export interface KudosItem {
  id: string;
  fromName: string;
  toName: string;
  badge: 'Team Player' | 'Problem Solver' | 'Customer Champion' | 'Innovation Star';
  message: string;
  dateIST: string;
  likes: number;
}

export interface GoalItem {
  id: string;
  title: string;
  quarter: string;
  progressPercent: number;
  keyResult: string;
  status: 'On Track' | 'At Risk' | 'Completed';
}

export interface PollItem {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  hasVoted: boolean;
  selectedOptionId?: string;
  totalVotes: number;
  expiresAt: string;
}

export interface SmartReminderPreferences {
  remindPunchInAtOffice: boolean;
  remindPunchOutAtShiftEnd: boolean;
  remindPendingTimesheet: boolean;
  timesheetReminderTime: string; // e.g. "18:30"
  quietHoursStart: string; // e.g. "21:00"
  quietHoursEnd: string; // e.g. "08:00"
}
