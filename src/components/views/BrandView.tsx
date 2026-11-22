import React, { useState } from 'react';
import { MonthlyRoster, Employee, Brand, Pod, PublicHoliday, ProcessType } from '../../types';
import { isBrandActiveOnDate } from '../../engine/scheduler';
import { Building2, Check, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface BrandViewProps {
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
  pods: Pod[];
  holidays: PublicHoliday[];
  onSelectConflictDate?: (brandId: string, date: string) => void;
}

export const BrandView: React.FC<BrandViewProps> = ({
  roster,
  employees,
  brands,
  pods,
  holidays,
  onSelectConflictDate,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SINGLE' | 'MULTI' | 'GAPS'>('ALL');
  const [podFilter, setPodFilter] = useState<string>('ALL');

  const dates = Object.keys(roster.entries[employees[0]?.id] || {}).sort();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const getCalendarBadge = (cal: string) => {
    switch (cal) {
      case '365_DAYS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            365 Days (24/7)
          </span>
        );
      case 'DAILY_EXCEPT_HOLIDAYS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Daily (Excl. Holidays)
          </span>
        );
      case 'MON_SAT_EXCEPT_HOLIDAYS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Mon–Sat
          </span>
        );
      case 'MON_FRI_EXCEPT_HOLIDAYS':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Mon–Fri
          </span>
        );
    }
  };

  const filteredBrands = brands.filter((brand) => {
    if (podFilter !== 'ALL' && brand.podId !== podFilter) return false;
    if (filterType === 'SINGLE') return brand.isSingleResource;
    if (filterType === 'MULTI') return !brand.isSingleResource;
    if (filterType === 'GAPS') {
      return roster.conflicts.some((c) => c.brandId === brand.id);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Brands ({brands.length})
          </button>
          <button
            onClick={() => setFilterType('SINGLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'SINGLE'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Single-Resource Brands (81%)
          </button>
          <button
            onClick={() => setFilterType('MULTI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'MULTI'
                ? 'bg-violet-600 text-white'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            Multi-Resource Brands (19%)
          </button>
          <button
            onClick={() => setFilterType('GAPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'GAPS'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Brands with Coverage Deficit
          </button>
        </div>

        <select
          value={podFilter}
          onChange={(e) => setPodFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
        >
          <option value="ALL">All Operational Pods</option>
          {pods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.split('—')[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Brand Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 min-w-[240px] font-bold shadow-xs">
                  Client Brand Details
                </th>
                <th className="px-3 py-3 font-semibold min-w-[130px]">Calendar & Type</th>
                <th className="px-3 py-3 font-semibold min-w-[160px]">Assigned Specialist(s)</th>
                {dates.map((dateStr) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  return (
                    <th
                      key={dateStr}
                      className="px-1 py-2 text-center min-w-[38px] border-l border-slate-200"
                    >
                      <div className="text-[10px] text-slate-400">
                        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </div>
                      <div className="text-xs font-bold text-slate-700">{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBrands.map((brand) => {
                const assignees = brand.primaryAssigneeIds.map((id) => empMap.get(id)).filter(Boolean);

                return (
                  <tr key={brand.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Brand Name & Processes */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-200 shadow-xs">
                      <div className="font-bold text-slate-900 text-sm">{brand.name}</div>
                      <div className="text-[11px] text-slate-500">{brand.category}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {brand.requiredProcesses.map((req) => (
                          <span
                            key={req.processId}
                            className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {req.processId} (Req: {req.minStaffingWeekday})
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Operating Calendar */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {getCalendarBadge(brand.operatingCalendar)}
                        <span className="block text-[10px] font-semibold text-slate-500">
                          {brand.isSingleResource ? 'Solo Resource (1 Assignee)' : 'Multi-Staff (Team)'}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Personnel */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {assignees.map((emp) => (
                          <div key={emp?.id} className="text-xs font-medium text-slate-800 truncate">
                            • {emp?.name}{' '}
                            <span className="text-[10px] text-slate-400">({emp?.skills.join(',')})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* 30-Day Coverage Status Indicators */}
                    {dates.map((dateStr) => {
                      const isActive = isBrandActiveOnDate(brand.operatingCalendar, dateStr, holidays);

                      if (!isActive) {
                        return (
                          <td
                            key={dateStr}
                            className="px-1 py-1 text-center border-l border-slate-100 bg-slate-50/50"
                            title="Brand closed as per operating calendar"
                          >
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" />
                          </td>
                        );
                      }

                      // Count active workers covering this brand today
                      let activeStaff = 0;
                      brand.primaryAssigneeIds.forEach((empId) => {
                        const entry = roster.entries[empId]?.[dateStr];
                        if (
                          entry?.status === 'WORKING' &&
                          entry.shifts.some((s) => s.brandId === brand.id)
                        ) {
                          activeStaff++;
                        }
                      });

                      // Also count backup floaters
                      employees.forEach((emp) => {
                        if (brand.primaryAssigneeIds.includes(emp.id)) return;
                        const entry = roster.entries[emp.id]?.[dateStr];
                        if (
                          entry?.status === 'WORKING' &&
                          entry.shifts.some((s) => s.brandId === brand.id)
                        ) {
                          activeStaff++;
                        }
                      });

                      const isSatisfied = activeStaff > 0;

                      return (
                        <td
                          key={dateStr}
                          className="px-1 py-1 text-center border-l border-slate-100"
                        >
                          <div
                            className={`w-7 h-7 mx-auto rounded flex items-center justify-center font-bold text-[10px] shadow-2xs ${
                              isSatisfied
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            }`}
                            title={`${brand.name} on ${dateStr}: ${
                              isSatisfied
                                ? `Covered (${activeStaff} staff active)`
                                : `CRITICAL GAP (0 active staff)`
                            }`}
                          >
                            {activeStaff}
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
