import React, { useState } from 'react';
import { MonthlyRoster, Employee, Brand, PublicHoliday, ShiftStatus } from '../../types';
import {
  User,
  Calendar,
  Briefcase,
  Clock,
  Award,
  CheckCircle2,
  Coffee,
  HeartPulse,
} from 'lucide-react';

interface EmployeeViewProps {
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
  holidays: PublicHoliday[];
  onCellClick: (employeeId: string, date: string) => void;
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({
  roster,
  employees,
  brands,
  holidays,
  onCellClick,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || 'EMP001');

  const employee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const assignedBrand = brands.find((b) => b.primaryAssigneeIds.includes(employee.id));
  const dates = Object.keys(roster.entries[employee.id] || {}).sort();
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  // Monthly Metrics Calculation
  let workingDays = 0;
  let weeklyOffs = 0;
  let leavesCount = 0;
  let compOffs = 0;
  let holidaysOff = 0;
  let totalHours = 0;

  dates.forEach((d) => {
    const entry = roster.entries[employee.id]?.[d];
    if (!entry) return;

    if (entry.status === 'WORKING') {
      workingDays++;
      totalHours += entry.shifts.reduce((acc, s) => acc + s.hours, 0) || 8;
    } else if (entry.status === 'WEEKLY_OFF') {
      weeklyOffs++;
    } else if (entry.status === 'PLANNED_LEAVE' || entry.status === 'SICK_LEAVE') {
      leavesCount++;
    } else if (entry.status === 'COMP_OFF') {
      compOffs++;
    } else if (entry.status === 'HOLIDAY_OFF') {
      holidaysOff++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Employee Selector & Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md ${
                employee.avatarBg || 'bg-indigo-600'
              }`}
            >
              {employee.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {employee.role}
                </span>
                {employee.isDedicatedSolo && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                    Solo Dedicated Specialist
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {employee.id} • {employee.email} • {employee.podId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Select Specialist:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id} - {e.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Working Days</span>
            <div className="text-xl font-bold text-indigo-900 mt-0.5">{workingDays} Days</div>
            <span className="text-[10px] text-indigo-600 font-medium">~{totalHours} Scheduled Hours</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Offs</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{weeklyOffs} Days</div>
            <span className="text-[10px] text-slate-500">Target: {employee.contractedWeeklyOffs * 4} days</span>
          </div>

          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Approved Leaves</span>
            <div className="text-xl font-bold text-rose-900 mt-0.5">{leavesCount} Days</div>
            <span className="text-[10px] text-rose-600 font-medium">Planned / Sick</span>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Comp-Offs</span>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{compOffs} Days</div>
            <span className="text-[10px] text-amber-600 font-medium">Compensatory</span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Public Holidays</span>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{holidaysOff} Days</div>
            <span className="text-[10px] text-emerald-600 font-medium">Official Rest</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Representation */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm">
            Monthly Shift Calendar — {employee.name}
          </h3>
          <span className="text-xs text-slate-500">
            Click any day to modify status or assign shifts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {dates.map((dateStr) => {
            const d = new Date(dateStr + 'T00:00:00');
            const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            const entry = roster.entries[employee.id]?.[dateStr];

            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            let label = 'Weekly Off';

            if (entry?.status === 'WORKING') {
              badgeBg = 'bg-indigo-50 border-indigo-200 text-indigo-900';
              label = 'Working';
            } else if (entry?.status === 'PLANNED_LEAVE' || entry?.status === 'SICK_LEAVE') {
              badgeBg = 'bg-rose-50 border-rose-200 text-rose-900';
              label = 'Leave';
            } else if (entry?.status === 'COMP_OFF') {
              badgeBg = 'bg-amber-50 border-amber-200 text-amber-900';
              label = 'Comp-Off';
            } else if (entry?.status === 'HOLIDAY_OFF') {
              badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
              label = 'Holiday';
            }

            return (
              <div
                key={dateStr}
                onClick={() => onCellClick(employee.id, dateStr)}
                className={`p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[96px] ${badgeBg} ${
                  entry?.isManualOverride ? 'ring-2 ring-violet-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    {dayOfWeek}
                  </span>
                  <span className="text-sm font-bold">{dayNum}</span>
                </div>

                <div className="mt-2">
                  <div className="text-xs font-bold leading-tight">{label}</div>
                  {entry?.status === 'WORKING' && entry.shifts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {entry.shifts.map((s, idx) => (
                        <div
                          key={idx}
                          className="text-[10px] font-medium bg-white/70 px-1 py-0.5 rounded text-indigo-950 truncate"
                          title={`${brandMap.get(s.brandId)?.name || s.brandId} - ${s.processId}`}
                        >
                          {brandMap.get(s.brandId)?.name?.slice(0, 12) || s.brandId} ({s.processId})
                        </div>
                      ))}
                    </div>
                  )}

                  {entry?.notes && (
                    <div className="text-[9px] text-slate-500 truncate mt-1 italic">
                      {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
