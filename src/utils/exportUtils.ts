import { MonthlyRoster, Employee, Brand, Pod } from '../types';

export function exportRosterToCSV(
  roster: MonthlyRoster,
  employees: Employee[],
  brands: Brand[],
  pods: Pod[]
): void {
  const dates = Object.keys(roster.entries[employees[0].id] || {}).sort();
  const podMap = new Map(pods.map((p) => [p.id, p.name]));
  const brandMap = new Map(brands.map((b) => [b.id, b.name]));

  // Build CSV Header
  const headers = ['Employee ID', 'Name', 'Role', 'Pod', ...dates.map((d) => d.slice(5))];
  const rows: string[][] = [headers];

  employees.forEach((emp) => {
    const podName = podMap.get(emp.podId) || emp.podId;
    const empRow: string[] = [emp.id, `"${emp.name}"`, emp.role, `"${podName}"`];

    dates.forEach((d) => {
      const entry = roster.entries[emp.id]?.[d];
      if (!entry) {
        empRow.push('-');
        return;
      }

      let cellText: string = entry.status;
      if (entry.status === 'WORKING' && entry.shifts.length > 0) {
        const brandNames = entry.shifts
          .map((s) => `${brandMap.get(s.brandId) || s.brandId} [${s.processId}]`)
          .join('; ');
        cellText = `W (${brandNames})`;
      } else if (entry.status === 'WEEKLY_OFF') {
        cellText = 'WO';
      } else if (entry.status === 'PLANNED_LEAVE') {
        cellText = 'LEAVE';
      } else if (entry.status === 'COMP_OFF') {
        cellText = 'COMP-OFF';
      } else if (entry.status === 'HOLIDAY_OFF') {
        cellText = 'HOLIDAY';
      }

      empRow.push(`"${cellText}"`);
    });

    rows.push(empRow);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Roster_${roster.month}_DataStraw.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportRosterToJSON(roster: MonthlyRoster): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(roster, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `Roster_${roster.month}_DataStraw.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
