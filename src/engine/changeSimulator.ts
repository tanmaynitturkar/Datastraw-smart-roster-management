import {
  Employee,
  Brand,
  PublicHoliday,
  DailyScheduleEntry,
  ShiftStatus,
  BackupRecommendation,
  MonthlyRoster,
  ProcessType,
} from '../types';
import { isBrandActiveOnDate } from './scheduler';
import { detectConflicts } from './conflictDetector';

export interface ChangeImpactAnalysis {
  employeeId: string;
  date: string;
  previousStatus: ShiftStatus;
  affectedBrands: {
    brand: Brand;
    isSingleResource: boolean;
    processesAffected: ProcessType[];
    canRemainingStaffCover: boolean;
    remainingStaffNames: string[];
    explanation: string;
  }[];
  backupRecommendations: BackupRecommendation[];
  summary: string;
}

/**
 * Analyzes the ripple impact of an employee becoming unavailable on a specific date
 */
export function analyzeEmployeeAbsence(
  employeeId: string,
  dateStr: string,
  roster: MonthlyRoster,
  employees: Employee[],
  brands: Brand[],
  holidays: PublicHoliday[]
): ChangeImpactAnalysis {
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) {
    throw new Error(`Employee with ID ${employeeId} not found.`);
  }

  const currentEntry: DailyScheduleEntry | undefined = roster.entries[employeeId]?.[dateStr];
  const previousStatus = currentEntry?.status || 'WEEKLY_OFF';

  // Find which brands this employee was assigned to cover today
  const assignedBrandShifts = currentEntry?.shifts || [];
  const assignedBrandIds = Array.from(new Set(assignedBrandShifts.map((s) => s.brandId)));

  const affectedBrands = assignedBrandIds.map((bId) => {
    const brand = brands.find((b) => b.id === bId)!;
    const isSingle = brand.isSingleResource;
    const affectedProcs = assignedBrandShifts
      .filter((s) => s.brandId === bId)
      .map((s) => s.processId);

    // Check other assignees on this brand
    const otherAssigneeIds = brand.primaryAssigneeIds.filter((id) => id !== employeeId);
    const activePeers = otherAssigneeIds.filter((id) => {
      const peerEntry = roster.entries[id]?.[dateStr];
      return peerEntry?.status === 'WORKING';
    });

    const activePeerEmps = employees.filter((e) => activePeers.includes(e.id));
    const peerNames = activePeerEmps.map((e) => e.name);

    if (isSingle) {
      return {
        brand,
        isSingleResource: true,
        processesAffected: affectedProcs,
        canRemainingStaffCover: false,
        remainingStaffNames: [],
        explanation: `CRITICAL GAP: ${brand.name} is a single-resource brand. Sole dedicated specialist ${emp.name} is absent, leaving all ${affectedProcs.join(', ')} client operations completely unstaffed! External backup required.`,
      };
    } else {
      // Multi-resource brand: check if remaining peers have the needed skills
      const peerSkills = new Set(activePeerEmps.flatMap((p) => p.skills));
      const allSkillsCovered = affectedProcs.every((proc) => peerSkills.has(proc));

      if (activePeerEmps.length > 0 && allSkillsCovered) {
        return {
          brand,
          isSingleResource: false,
          processesAffected: affectedProcs,
          canRemainingStaffCover: true,
          remainingStaffNames: peerNames,
          explanation: `INTERNAL ABSORPTION: ${brand.name} has ${activePeerEmps.length} active peer(s) today (${peerNames.join(', ')}). They possess the necessary skill sets (${affectedProcs.join(', ')}) to maintain the client's minimum staffing threshold.`,
        };
      } else {
        return {
          brand,
          isSingleResource: false,
          processesAffected: affectedProcs,
          canRemainingStaffCover: false,
          remainingStaffNames: peerNames,
          explanation: `DEFICIT DETECTED: While ${peerNames.length > 0 ? peerNames.join(', ') : 'no peers'} are working, they lack the specific skill requirements (${affectedProcs.join(', ')}) or cannot satisfy the minimum required headcount. External backup needed.`,
        };
      }
    }
  });

  // Evaluate candidate backups from the same Pod
  const candidateRecommendations: BackupRecommendation[] = [];
  const requiredSkills = new Set(assignedBrandShifts.map((s) => s.processId));

  employees.forEach((candidate) => {
    if (candidate.id === employeeId) return;

    const candEntry = roster.entries[candidate.id]?.[dateStr];
    const candStatus = candEntry?.status || 'WEEKLY_OFF';

    // Must not be on approved leave or sick leave
    if (candStatus === 'PLANNED_LEAVE' || candStatus === 'SICK_LEAVE') return;

    // Check skill overlap
    const matchingSkills = candidate.skills.filter((sk) => requiredSkills.has(sk));
    if (matchingSkills.length === 0) return;

    let score = 50;
    const reasons: string[] = [];

    // Same pod bonus
    if (candidate.podId === emp.podId) {
      score += 30;
      reasons.push(`Same Pod (${emp.podId}): Familiar with pod processes and clients`);
    } else {
      score += 10;
      reasons.push('Cross-pod resource');
    }

    // Role experience
    if (candidate.role === 'Senior Specialist' || candidate.role === 'Pod Lead') {
      score += 15;
      reasons.push(`High seniority (${candidate.role}) enables quick ramp-up`);
    }

    // Skill coverage
    score += matchingSkills.length * 10;
    reasons.push(`Covers skill(s): ${matchingSkills.join(', ')}`);

    // Availability status today
    if (candStatus === 'WEEKLY_OFF') {
      // Can be called in for comp-off
      score += 10;
      reasons.push('Currently on Weekly Off (Can be converted with 1 Comp-Off credit)');
    } else if (candStatus === 'WORKING') {
      // Already working: check if hours permit backup shift
      const currentHours = candEntry.shifts.reduce((acc, s) => acc + s.hours, 0);
      if (currentHours <= 4) {
        score += 25;
        reasons.push(`Light shift today (${currentHours}h assigned). Has capacity to absorb.`);
      } else {
        score -= 10;
        reasons.push(`Already working full shift (${currentHours}h). Risk of overload.`);
      }
    }

    candidateRecommendations.push({
      employee: candidate,
      score,
      reasons,
      currentStatusOnDate: candStatus,
    });
  });

  candidateRecommendations.sort((a, b) => b.score - a.score);

  return {
    employeeId,
    date: dateStr,
    previousStatus,
    affectedBrands,
    backupRecommendations: candidateRecommendations.slice(0, 5),
    summary:
      affectedBrands.length === 0
        ? `${emp.name} had no active client shifts scheduled on ${dateStr}. No operational disruption.`
        : `Absence affects ${affectedBrands.length} client brand(s): ${affectedBrands
            .map((b) => b.brand.name)
            .join(', ')}.`,
  };
}

/**
 * Applies a change resolution: marks employee absent and assigns the selected backup or adjusts peer shifts
 */
export function applyChangeResolution(
  roster: MonthlyRoster,
  employeeId: string,
  dateStr: string,
  absenceType: 'PLANNED_LEAVE' | 'SICK_LEAVE' | 'WEEKLY_OFF' | 'COMP_OFF',
  absenceReason: string,
  selectedBackupEmployeeId?: string,
  employees: Employee[] = [],
  brands: Brand[] = [],
  pods: any[] = [],
  holidays: PublicHoliday[] = [],
  leaves: any[] = []
): MonthlyRoster {
  // Deep clone entries
  const newEntries: Record<string, Record<string, DailyScheduleEntry>> = JSON.parse(
    JSON.stringify(roster.entries)
  );

  const previousEntry = newEntries[employeeId]?.[dateStr];
  const shiftsToReassign = previousEntry?.shifts || [];

  // 1. Update the absent employee
  newEntries[employeeId][dateStr] = {
    employeeId,
    date: dateStr,
    status: absenceType,
    shifts: [],
    isManualOverride: true,
    notes: absenceReason,
  };

  // 2. Assign to backup if chosen
  if (selectedBackupEmployeeId && shiftsToReassign.length > 0) {
    const backupEntry = newEntries[selectedBackupEmployeeId][dateStr] || {
      employeeId: selectedBackupEmployeeId,
      date: dateStr,
      status: 'WORKING',
      shifts: [],
      notes: '',
    };

    backupEntry.status = 'WORKING';
    backupEntry.isManualOverride = true;
    backupEntry.shifts = [
      ...backupEntry.shifts,
      ...shiftsToReassign.map((s) => ({
        ...s,
        isBackup: true,
      })),
    ];
    backupEntry.notes = `Backup assignment covering for ${previousEntry?.employeeId || 'absent peer'}`;

    newEntries[selectedBackupEmployeeId][dateStr] = backupEntry;
  }

  // 3. Re-run conflict detection with new state
  const dates = Object.keys(newEntries[employeeId] || {}).sort();
  const conflicts = detectConflicts(
    dates,
    employees,
    brands,
    pods,
    holidays,
    leaves,
    newEntries
  );

  return {
    ...roster,
    entries: newEntries,
    conflicts,
    status: conflicts.some((c) => c.severity === 'CRITICAL') ? 'DRAFT' : 'VALIDATED',
    generatedAt: new Date().toISOString(),
  };
}
