import {
  Employee,
  Brand,
  Pod,
  PublicHoliday,
  LeaveRequest,
  DailyScheduleEntry,
  SchedulingConflict,
  ProcessType,
} from '../types';
import { isBrandActiveOnDate } from './scheduler';

export function detectConflicts(
  dates: string[],
  employees: Employee[],
  brands: Brand[],
  pods: Pod[],
  holidays: PublicHoliday[],
  leaves: LeaveRequest[],
  entries: Record<string, Record<string, DailyScheduleEntry>>
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];

  const empMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));
  const brandMap = new Map<string, Brand>(brands.map((b) => [b.id, b]));
  const leaveMap = new Map<string, LeaveRequest>();
  leaves.forEach((l) => {
    if (l.status === 'APPROVED') {
      leaveMap.set(`${l.employeeId}_${l.date}`, l);
    }
  });

  // Track consecutive days for each employee
  employees.forEach((emp) => {
    let streak = 0;
    dates.forEach((dateStr) => {
      const entry = entries[emp.id]?.[dateStr];
      if (entry?.status === 'WORKING') {
        streak++;
        if (streak > emp.maxConsecutiveDays) {
          conflicts.push({
            id: `streak_${emp.id}_${dateStr}`,
            severity: 'WARNING',
            type: 'EXCESS_CONSECUTIVE_DAYS',
            date: dateStr,
            employeeId: emp.id,
            title: `Excess Consecutive Days: ${emp.name}`,
            description: `${emp.name} is scheduled to work ${streak} consecutive days without a mandatory rest day (limit is ${emp.maxConsecutiveDays}).`,
            suggestedAction: {
              actionType: 'SWAP_OFF_DAY',
              description: `Shift one weekly off earlier in the week to give ${emp.name} adequate recovery time.`,
            },
          });
        }
      } else {
        streak = 0;
      }
    });
  });

  // Check each day for brand coverage, single-resource vulnerability, and leave collisions
  dates.forEach((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.some((h) => h.date === dateStr);

    // 1. Brand & Process Staffing Checks
    brands.forEach((brand) => {
      const isBrandActive = isBrandActiveOnDate(brand.operatingCalendar, dateStr, holidays);
      if (!isBrandActive) return;

      brand.requiredProcesses.forEach((req) => {
        const requiredCount = isHoliday
          ? req.minStaffingHoliday
          : isWeekend
          ? req.minStaffingWeekend
          : req.minStaffingWeekday;

        if (requiredCount <= 0) return;

        // Count who is actually working this brand + process today
        const activeAssignees = brand.primaryAssigneeIds.filter((empId) => {
          const entry = entries[empId]?.[dateStr];
          return (
            entry?.status === 'WORKING' &&
            entry.shifts.some((s) => s.brandId === brand.id && s.processId === req.processId)
          );
        });

        // Also check if any external pod floater/backup is covering
        const backupAssignees = employees.filter((emp) => {
          if (brand.primaryAssigneeIds.includes(emp.id)) return false;
          const entry = entries[emp.id]?.[dateStr];
          return (
            entry?.status === 'WORKING' &&
            entry.shifts.some((s) => s.brandId === brand.id && s.processId === req.processId)
          );
        });

        const totalActive = activeAssignees.length + backupAssignees.length;

        if (totalActive < requiredCount) {
          // Identify potential backup candidates from same pod
          const candidateFloater = employees.find(
            (e) =>
              e.podId === brand.podId &&
              !brand.primaryAssigneeIds.includes(e.id) &&
              e.skills.includes(req.processId) &&
              entries[e.id]?.[dateStr]?.status !== 'PLANNED_LEAVE' &&
              entries[e.id]?.[dateStr]?.status !== 'SICK_LEAVE'
          );

          if (brand.isSingleResource) {
            const soloEmp = empMap.get(brand.primaryAssigneeIds[0]);
            const soloEntry = entries[soloEmp?.id || '']?.[dateStr];
            const reason =
              soloEntry?.status === 'PLANNED_LEAVE' || soloEntry?.status === 'SICK_LEAVE'
                ? `on approved leave (${soloEntry.notes || 'personal'})`
                : soloEntry?.status === 'WEEKLY_OFF'
                ? 'scheduled on weekly off'
                : 'unavailable';

            conflicts.push({
              id: `gap_solo_${brand.id}_${req.processId}_${dateStr}`,
              severity: 'CRITICAL',
              type: 'SINGLE_RESOURCE_GAP',
              date: dateStr,
              brandId: brand.id,
              processId: req.processId,
              employeeId: soloEmp?.id,
              title: `Single-Resource Coverage Gap: ${brand.name} (${req.processId})`,
              description: `${brand.name} requires ${req.processId} coverage on ${dateStr}, but its sole dedicated specialist (${soloEmp?.name}) is ${reason}. Staffing: 0/${requiredCount}.`,
              suggestedAction: candidateFloater
                ? {
                    actionType: 'ASSIGN_BACKUP',
                    candidateEmployeeId: candidateFloater.id,
                    description: `Assign peer floater ${candidateFloater.name} (${candidateFloater.role}) from ${brand.podId} to cover ${req.processId}.`,
                  }
                : undefined,
            });
          } else {
            conflicts.push({
              id: `gap_multi_${brand.id}_${req.processId}_${dateStr}`,
              severity: 'CRITICAL',
              type: 'COVERAGE_GAP',
              date: dateStr,
              brandId: brand.id,
              processId: req.processId,
              title: `Understaffed Process: ${brand.name} (${req.processId})`,
              description: `Required coverage: ${requiredCount} specialist(s), but only ${totalActive} is active today on ${dateStr}.`,
              suggestedAction: candidateFloater
                ? {
                    actionType: 'ASSIGN_BACKUP',
                    candidateEmployeeId: candidateFloater.id,
                    description: `Deploy backup ${candidateFloater.name} to fulfill minimum coverage.`,
                  }
                : undefined,
            });
          }
        }
      });
    });

    // 2. Check for Leave Collisions & Overlaps
    employees.forEach((emp) => {
      const entry = entries[emp.id]?.[dateStr];
      const leave = leaveMap.get(`${emp.id}_${dateStr}`);

      // If approved leave exists but status was forced to WORKING
      if (leave && entry?.status === 'WORKING') {
        conflicts.push({
          id: `leave_collision_${emp.id}_${dateStr}`,
          severity: 'CRITICAL',
          type: 'LEAVE_COLLISION',
          date: dateStr,
          employeeId: emp.id,
          title: `Approved Leave Collision: ${emp.name}`,
          description: `${emp.name} has approved ${leave.type} ("${leave.reason}") on ${dateStr}, but is scheduled to work!`,
          suggestedAction: {
            actionType: 'APPROVE_OVERRIDE',
            description: `Revert ${emp.name}'s status to ${leave.type} and designate a pod peer to absorb client duties.`,
          },
        });
      }

      // Check shift hour overload (> 10 hours)
      if (entry && entry.shifts) {
        const totalHours = entry.shifts.reduce((acc, s) => acc + s.hours, 0);
        if (totalHours > 10) {
          conflicts.push({
            id: `overload_${emp.id}_${dateStr}`,
            severity: 'WARNING',
            type: 'OVERLAPPING_SHIFTS',
            date: dateStr,
            employeeId: emp.id,
            title: `Excess Daily Workload: ${emp.name}`,
            description: `${emp.name} has ${totalHours} hours assigned across multiple brand processes on ${dateStr}.`,
          });
        }
      }
    });
  });

  return conflicts;
}
