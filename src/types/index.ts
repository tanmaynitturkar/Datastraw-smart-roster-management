export type ProcessType = 'CS' | 'ACC' | 'Retention' | 'NDR' | 'CatalogOps';

export type OperatingCalendarType = 
  | '365_DAYS'               // Operates every day including Sundays and public holidays
  | 'DAILY_EXCEPT_HOLIDAYS'  // Operates Mon-Sun, closed on Public Holidays
  | 'MON_SAT_EXCEPT_HOLIDAYS'// Operates Mon-Sat, closed on Sundays and Public Holidays
  | 'MON_FRI_EXCEPT_HOLIDAYS';// Operates Mon-Fri, closed on Weekends and Public Holidays

export type ShiftStatus = 
  | 'WORKING' 
  | 'WEEKLY_OFF' 
  | 'PLANNED_LEAVE' 
  | 'COMP_OFF' 
  | 'SICK_LEAVE' 
  | 'HOLIDAY_OFF';

export type RosterStateStatus = 'DRAFT' | 'VALIDATED' | 'PUBLISHED';

export interface Pod {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  podId: string;
  role: 'Pod Lead' | 'Operations Specialist' | 'Senior Specialist';
  skills: ProcessType[];
  contractedWeeklyOffs: number; // e.g., 2 days off per week
  preferredOffDays: number[];   // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  maxConsecutiveDays: number;   // standard is 6
  isDedicatedSolo?: boolean;    // indicates employee manages a single-resource brand
  avatarBg?: string;
}

export interface ProcessRequirement {
  processId: ProcessType;
  minStaffingWeekday: number;
  minStaffingWeekend: number;
  minStaffingHoliday: number;
  overrideCalendar?: OperatingCalendarType;
}

export interface Brand {
  id: string;
  name: string;
  podId: string;
  category: string;
  operatingCalendar: OperatingCalendarType;
  requiredProcesses: ProcessRequirement[];
  isSingleResource: boolean; // ~80% of brands are single dedicated employee
  primaryAssigneeIds: string[];
}

export interface Assignment {
  brandId: string;
  processId: ProcessType;
  employeeId: string;
  isPrimary: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string; // 'YYYY-MM-DD'
  type: 'PLANNED_LEAVE' | 'COMP_OFF' | 'SICK_LEAVE';
  reason: string;
  status: 'APPROVED' | 'PENDING';
}

export interface PublicHoliday {
  date: string; // 'YYYY-MM-DD'
  name: string;
}

export interface ShiftAssignment {
  brandId: string;
  processId: ProcessType;
  hours: number;
  isBackup?: boolean;
}

export interface DailyScheduleEntry {
  employeeId: string;
  date: string; // 'YYYY-MM-DD'
  status: ShiftStatus;
  shifts: ShiftAssignment[];
  isManualOverride?: boolean;
  notes?: string;
}

export type ConflictSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SchedulingConflict {
  id: string;
  severity: ConflictSeverity;
  type: 
    | 'COVERAGE_GAP'
    | 'LEAVE_COLLISION'
    | 'SINGLE_RESOURCE_GAP'
    | 'EXCESS_CONSECUTIVE_DAYS'
    | 'PREFERENCE_VIOLATION'
    | 'OVERLAPPING_SHIFTS';
  date: string;
  brandId?: string;
  processId?: ProcessType;
  employeeId?: string;
  title: string;
  description: string;
  suggestedAction?: {
    actionType: 'ASSIGN_BACKUP' | 'SWAP_OFF_DAY' | 'APPROVE_OVERRIDE';
    candidateEmployeeId?: string;
    description: string;
  };
}

export interface MonthlyRoster {
  month: string; // '2026-11'
  year: number;
  monthIndex: number; // 0-11
  daysInMonth: number;
  status: RosterStateStatus;
  entries: Record<string, Record<string, DailyScheduleEntry>>; // [employeeId][date]
  conflicts: SchedulingConflict[];
  generatedAt: string;
}

export interface BackupRecommendation {
  employee: Employee;
  score: number;
  reasons: string[];
  currentStatusOnDate: ShiftStatus;
}
