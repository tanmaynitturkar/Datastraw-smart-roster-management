import {
  Pod,
  Employee,
  Brand,
  PublicHoliday,
  LeaveRequest,
  DailyScheduleEntry,
  ShiftStatus,
  ShiftAssignment,
  OperatingCalendarType,
  MonthlyRoster,
  ProcessType,
} from '../types';
import { detectConflicts } from './conflictDetector';

export interface ScheduleOptions {
  autoAssignBackups?: boolean;
  respectPreferences?: boolean;
  enforceFairOffs?: boolean;
}

export function isBrandActiveOnDate(
  calendar: OperatingCalendarType,
  dateStr: string,
  holidays: PublicHoliday[]
): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
  const isHoliday = holidays.some((h) => h.date === dateStr);

  switch (calendar) {
    case '365_DAYS':
      return true;
    case 'DAILY_EXCEPT_HOLIDAYS':
      return !isHoliday;
    case 'MON_SAT_EXCEPT_HOLIDAYS':
      return dayOfWeek !== 0 && !isHoliday;
    case 'MON_FRI_EXCEPT_HOLIDAYS':
      return dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday;
    default:
      return true;
  }
}

export function getDaysInMonth(year: number, monthIndex: number): string[] {
  const dates: string[] = [];
  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  for (let d = 1; d <= daysCount; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    dates.push(`${year}-${monthStr}-${dayStr}`);
  }
  return dates;
}

/**
 * Smart Roster Generator Engine
 * Deterministic scheduling with constraint satisfaction & fallback resolution
 */
export function generateMonthlyRoster(
  year: number,
  monthIndex: number,
  employees: Employee[],
  brands: Brand[],
  pods: Pod[],
  holidays: PublicHoliday[],
  leaves: LeaveRequest[],
  existingEntries?: Record<string, Record<string, DailyScheduleEntry>>,
  options: ScheduleOptions = { autoAssignBackups: false, respectPreferences: true, enforceFairOffs: true }
): MonthlyRoster {
  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const dates = getDaysInMonth(year, monthIndex);
  const entries: Record<string, Record<string, DailyScheduleEntry>> = {};

  // Build quick lookups
  const leaveMap = new Map<string, LeaveRequest>();
  leaves.forEach((l) => {
    if (l.status === 'APPROVED') {
      leaveMap.set(`${l.employeeId}_${l.date}`, l);
    }
  });

  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.name));

  // Initialize entry matrix for each employee
  employees.forEach((emp) => {
    entries[emp.id] = {};
  });

  // Track employee working streak to prevent exceeding max consecutive days
  const consecutiveWorkDays = new Map<string, number>();
  employees.forEach((emp) => consecutiveWorkDays.set(emp.id, 0));

  // Step 1: Assign initial base schedules day by day
  dates.forEach((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const isHoliday = holidayMap.has(dateStr);

    employees.forEach((emp) => {
      // Check manual override if existing
      const existing = existingEntries?.[emp.id]?.[dateStr];
      if (existing && existing.isManualOverride) {
        entries[emp.id][dateStr] = existing;
        if (existing.status === 'WORKING') {
          consecutiveWorkDays.set(emp.id, (consecutiveWorkDays.get(emp.id) || 0) + 1);
        } else {
          consecutiveWorkDays.set(emp.id, 0);
        }
        return;
      }

      // Check approved leaves / comp-offs (Hard Constraint #1)
      const leaveKey = `${emp.id}_${dateStr}`;
      const leave = leaveMap.get(leaveKey);
      if (leave) {
        const leaveStatus: ShiftStatus =
          leave.type === 'COMP_OFF'
            ? 'COMP_OFF'
            : leave.type === 'SICK_LEAVE'
            ? 'SICK_LEAVE'
            : 'PLANNED_LEAVE';

        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: leaveStatus,
          shifts: [],
          notes: leave.reason,
        };
        consecutiveWorkDays.set(emp.id, 0);
        return;
      }

      // Find brands assigned to this employee
      const assignedBrands = brands.filter((b) => b.primaryAssigneeIds.includes(emp.id));

      if (assignedBrands.length === 0) {
        // Unassigned or floating pod member / lead
        const isDefaultOff = dayOfWeek === 0 || dayOfWeek === 6;
        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: isDefaultOff ? 'WEEKLY_OFF' : 'WORKING',
          shifts: [],
          notes: isDefaultOff ? 'Standard Weekend Off' : 'Pod Operations & Floater Support',
        };
        consecutiveWorkDays.set(emp.id, isDefaultOff ? 0 : (consecutiveWorkDays.get(emp.id) || 0) + 1);
        return;
      }

      // Check if ALL assigned brands are closed on this date
      const allBrandsClosed = assignedBrands.every(
        (b) => !isBrandActiveOnDate(b.operatingCalendar, dateStr, holidays)
      );

      if (allBrandsClosed) {
        // If closed because of public holiday
        const status: ShiftStatus = isHoliday ? 'HOLIDAY_OFF' : 'WEEKLY_OFF';
        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status,
          shifts: [],
          notes: isHoliday ? `Holiday: ${holidayMap.get(dateStr)}` : 'Client brand closed',
        };
        consecutiveWorkDays.set(emp.id, 0);
        return;
      }

      // Single-resource brand assignment
      if (emp.isDedicatedSolo || assignedBrands.some((b) => b.isSingleResource)) {
        const soloBrand = assignedBrands[0];
        const isBrandActive = isBrandActiveOnDate(soloBrand.operatingCalendar, dateStr, holidays);

        if (!isBrandActive) {
          entries[emp.id][dateStr] = {
            employeeId: emp.id,
            date: dateStr,
            status: isHoliday ? 'HOLIDAY_OFF' : 'WEEKLY_OFF',
            shifts: [],
            notes: isHoliday ? `Holiday: ${holidayMap.get(dateStr)}` : 'Brand non-operational',
          };
          consecutiveWorkDays.set(emp.id, 0);
          return;
        }

        // Brand is active. Can employee take a weekly off today?
        const currentStreak = consecutiveWorkDays.get(emp.id) || 0;
        const isPreferredOffDay = emp.preferredOffDays.includes(dayOfWeek);

        // For a 365-day brand, the solo employee must take their contractual weekly off (e.g., 2 days/week)
        // If options.autoAssignBackups is false, scheduling the weekly off creates a documented coverage gap
        // which the operations manager can review or resolve with backup allocation.
        if (isPreferredOffDay && soloBrand.operatingCalendar === '365_DAYS') {
          // Employee takes planned weekly off
          entries[emp.id][dateStr] = {
            employeeId: emp.id,
            date: dateStr,
            status: 'WEEKLY_OFF',
            shifts: [],
            notes: 'Contractual Weekly Off (Requires Pod Floater / Backup for 365-day coverage)',
          };
          consecutiveWorkDays.set(emp.id, 0);
          return;
        }

        // If streak > maxConsecutiveDays (6 days), force weekly off
        if (currentStreak >= emp.maxConsecutiveDays) {
          entries[emp.id][dateStr] = {
            employeeId: emp.id,
            date: dateStr,
            status: 'WEEKLY_OFF',
            shifts: [],
            notes: 'Mandatory rest after 6 consecutive days',
          };
          consecutiveWorkDays.set(emp.id, 0);
          return;
        }

        // Otherwise, solo employee works all required processes for their brand
        const shifts: ShiftAssignment[] = soloBrand.requiredProcesses.map((req) => ({
          brandId: soloBrand.id,
          processId: req.processId,
          hours: Math.round(8 / Math.max(soloBrand.requiredProcesses.length, 1)),
        }));

        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: 'WORKING',
          shifts,
          notes: `Full brand management (${soloBrand.name})`,
        };
        consecutiveWorkDays.set(emp.id, currentStreak + 1);
        return;
      }

      // Multi-resource brand assignment: Stagger weekly offs
      const primaryBrand = assignedBrands[0];
      const isBrandActive = isBrandActiveOnDate(primaryBrand.operatingCalendar, dateStr, holidays);

      if (!isBrandActive) {
        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: isHoliday ? 'HOLIDAY_OFF' : 'WEEKLY_OFF',
          shifts: [],
          notes: isHoliday ? `Holiday: ${holidayMap.get(dateStr)}` : 'Client brand closed',
        };
        consecutiveWorkDays.set(emp.id, 0);
        return;
      }

      // Check if employee's preferred off day
      const isPreferredOff = emp.preferredOffDays.includes(dayOfWeek);
      const currentStreak = consecutiveWorkDays.get(emp.id) || 0;

      // Staggering rule: If peer on same brand is already off, check if this employee can take off
      const peerIds = primaryBrand.primaryAssigneeIds.filter((id) => id !== emp.id);
      const peersOffToday = peerIds.filter(
        (id) =>
          entries[id]?.[dateStr]?.status === 'WEEKLY_OFF' ||
          entries[id]?.[dateStr]?.status === 'PLANNED_LEAVE' ||
          entries[id]?.[dateStr]?.status === 'COMP_OFF'
      ).length;

      // If too many peers are off and brand needs coverage, employee must work (Mandatory constraint > Preference)
      const mustCoverForPeers = peersOffToday >= peerIds.length && primaryBrand.operatingCalendar === '365_DAYS';

      if (currentStreak >= emp.maxConsecutiveDays && !mustCoverForPeers) {
        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: 'WEEKLY_OFF',
          shifts: [],
          notes: 'Mandatory weekly off (6-day limit)',
        };
        consecutiveWorkDays.set(emp.id, 0);
        return;
      }

      if (isPreferredOff && !mustCoverForPeers) {
        entries[emp.id][dateStr] = {
          employeeId: emp.id,
          date: dateStr,
          status: 'WEEKLY_OFF',
          shifts: [],
          notes: 'Preferred weekly off',
        };
        consecutiveWorkDays.set(emp.id, 0);
        return;
      }

      // Employee works: assign their specific processes
      // Find matching processes between employee skills and brand needs
      const relevantProcesses = primaryBrand.requiredProcesses
        .filter((req) => emp.skills.includes(req.processId))
        .map((req) => req.processId);

      const assignedProcessList: ProcessType[] =
        relevantProcesses.length > 0 ? relevantProcesses : [emp.skills[0]];

      const shifts: ShiftAssignment[] = assignedProcessList.map((proc) => ({
        brandId: primaryBrand.id,
        processId: proc,
        hours: Math.round(8 / assignedProcessList.length),
      }));

      entries[emp.id][dateStr] = {
        employeeId: emp.id,
        date: dateStr,
        status: 'WORKING',
        shifts,
        notes: `Assigned: ${assignedProcessList.join(', ')}`,
      };
      consecutiveWorkDays.set(emp.id, currentStreak + 1);
    });
  });

  // Step 2: Auto-assign Pod floaters / backups if option enabled
  if (options.autoAssignBackups) {
    dates.forEach((dateStr) => {
      brands.forEach((brand) => {
        const isBrandActive = isBrandActiveOnDate(brand.operatingCalendar, dateStr, holidays);
        if (!isBrandActive) return;

        brand.requiredProcesses.forEach((req) => {
          // Check working count
          const workingCount = brand.primaryAssigneeIds.filter((empId) => {
            const entry = entries[empId]?.[dateStr];
            return (
              entry?.status === 'WORKING' &&
              entry.shifts.some((s) => s.brandId === brand.id && s.processId === req.processId)
            );
          }).length;

          if (workingCount < 1) {
            // Find a qualified floater in the same pod who is currently free or on normal operations
            const podEmployees = employees.filter((e) => e.podId === brand.podId);
            const floater = podEmployees.find((e) => {
              const entry = entries[e.id]?.[dateStr];
              return (
                e.skills.includes(req.processId) &&
                !brand.primaryAssigneeIds.includes(e.id) &&
                entry?.status === 'WORKING' &&
                (entry.shifts.length === 0 || entry.shifts.every((s) => s.isBackup))
              );
            });

            if (floater) {
              const entry = entries[floater.id][dateStr];
              entry.shifts.push({
                brandId: brand.id,
                processId: req.processId,
                hours: 4,
                isBackup: true,
              });
              entry.notes = `Covering backup for ${brand.name} (${req.processId})`;
            }
          }
        });
      });
    });
  }

  // Step 3: Run comprehensive Conflict Detection
  const conflicts = detectConflicts(dates, employees, brands, pods, holidays, leaves, entries);

  return {
    month: monthStr,
    year,
    monthIndex,
    daysInMonth: dates.length,
    status: conflicts.some((c) => c.severity === 'CRITICAL') ? 'DRAFT' : 'VALIDATED',
    entries,
    conflicts,
    generatedAt: new Date().toISOString(),
  };
}
