import React, { useState } from 'react';
import {
  MonthlyRoster,
  Employee,
  Brand,
  Pod,
  PublicHoliday,
  ShiftStatus,
  ProcessType,
} from '../../types';
import { Search, Filter, Calendar as CalendarIcon, Info } from 'lucide-react';

interface CompanyViewProps {
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
  pods: Pod[];
  holidays: PublicHoliday[];
  onCellClick: (employeeId: string, date: string) => void;
}

export const CompanyView: React.FC<CompanyViewProps> = ({
  roster,
  employees,
  brands,
  pods,
  holidays,
  onCellClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPod, setSelectedPod] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  const dates = Object.keys(roster.entries[employees[0]?.id] || {}).sort();
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPod = selectedPod === 'ALL' || emp.podId === selectedPod;
    const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole;

    return matchesSearch && matchesPod && matchesRole;
  });

  const getShiftBadge = (status: ShiftStatus, shiftCount: number, isOverride?: boolean) => {
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = 'WO';

    switch (status) {
      case 'WORKING':
        bg = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
        label = shiftCount > 1 ? `W (${shiftCount})` : 'W';
        break;
      case 'WEEKLY_OFF':
        bg = 'bg-slate-100 text-slate-500 border-slate-200';
        label = 'WO';
        break;
      case 'PLANNED_LEAVE':
      case 'SICK_LEAVE':
        bg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        label = 'L';
        break;
      case 'COMP_OFF':
        bg = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
        label = 'CO';
        break;
      case 'HOLIDAY_OFF':
        bg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
        label = 'H';
        break;
    }

    return (
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center text-xs border transition-transform hover:scale-110 cursor-pointer shadow-xs ${bg} ${
          isOverride ? 'ring-2 ring-violet-500' : ''
        }`}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, ID, or skill (e.g. CS, NDR)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Pod Filter */}
          <select
            value={selectedPod}
            onChange={(e) => setSelectedPod(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Operational Pods</option>
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.split('—')[0]}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="Pod Lead">Pod Leads</option>
            <option value="Senior Specialist">Senior Specialists</option>
            <option value="Operations Specialist">Operations Specialists</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-300 flex items-center justify-center text-[9px] font-bold">W</span> Working
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 text-slate-500 border border-slate-300 flex items-center justify-center text-[9px]">WO</span> Weekly Off
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center text-[9px] font-bold">L</span> Leave
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center text-[9px] font-bold">CO</span> Comp-Off
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-[9px] font-bold">H</span> Holiday
          </span>
        </div>
      </div>

      {/* Roster Grid Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 min-w-[220px] font-bold shadow-xs">
                  Employee Details ({filteredEmployees.length})
                </th>
                <th className="px-3 py-3 font-semibold min-w-[120px]">Assigned Brand</th>
                {dates.map((dateStr) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const dayNum = d.getDate();
                  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isHoliday = holidayMap.has(dateStr);

                  return (
                    <th
                      key={dateStr}
                      className={`px-1 py-2 text-center min-w-[42px] border-l border-slate-200 ${
                        isHoliday
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : isWeekend
                          ? 'bg-slate-100/80 text-slate-800'
                          : 'bg-slate-50'
                      }`}
                      title={isHoliday ? `Public Holiday: ${holidayMap.get(dateStr)}` : dateStr}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-500">{dayOfWeek}</div>
                      <div className={`text-xs font-bold ${isHoliday ? 'text-emerald-700' : ''}`}>
                        {dayNum}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.map((emp) => {
                const assignedBrand = brands.find((b) => b.primaryAssigneeIds.includes(emp.id));

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sticky Employee Name Column */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            emp.avatarBg || 'bg-indigo-600'
                          }`}
                        >
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            {emp.isDedicatedSolo && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                                Solo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span>{emp.id}</span> • <span>{emp.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Brand */}
                    <td className="px-3 py-2.5 text-slate-700 font-medium">
                      {assignedBrand ? (
                        <div className="truncate max-w-[140px]" title={assignedBrand.name}>
                          <span className="font-semibold text-slate-800">{assignedBrand.name}</span>
                          <div className="text-[10px] text-slate-400">{assignedBrand.category}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pod Floater / Lead</span>
                      )}
                    </td>

                    {/* 30 Day Schedule Cells */}
                    {dates.map((dateStr) => {
                      const entry = roster.entries[emp.id]?.[dateStr];
                      if (!entry) {
                        return (
                          <td key={dateStr} className="px-1 py-1 text-center border-l border-slate-100">
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={dateStr}
                          onClick={() => onCellClick(emp.id, dateStr)}
                          className="px-1 py-1 text-center border-l border-slate-100"
                          title={`Click to edit: ${emp.name} on ${dateStr} (${entry.status}) - ${entry.notes || ''}`}
                        >
                          <div className="flex justify-center">
                            {getShiftBadge(entry.status, entry.shifts.length, entry.isManualOverride)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
