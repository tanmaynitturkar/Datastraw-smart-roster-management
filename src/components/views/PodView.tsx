import React, { useState } from 'react';
import { MonthlyRoster, Employee, Brand, Pod, PublicHoliday, ShiftStatus } from '../../types';
import { Users, UserCheck, Shield, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface PodViewProps {
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
  pods: Pod[];
  holidays: PublicHoliday[];
  onCellClick: (employeeId: string, date: string) => void;
}

export const PodView: React.FC<PodViewProps> = ({
  roster,
  employees,
  brands,
  pods,
  holidays,
  onCellClick,
}) => {
  const [expandedPodId, setExpandedPodId] = useState<string>(pods[0]?.id || '');
  const dates = Object.keys(roster.entries[employees[0]?.id] || {}).sort();

  return (
    <div className="space-y-6">
      {/* Pod Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pods.map((pod) => {
          const podMembers = employees.filter((e) => e.podId === pod.id);
          const podBrands = brands.filter((b) => b.podId === pod.id);
          const isSelected = expandedPodId === pod.id;

          // Calculate pod health: check any conflicts in this pod
          const podConflicts = roster.conflicts.filter(
            (c) =>
              (c.brandId && podBrands.some((b) => b.id === c.brandId)) ||
              (c.employeeId && podMembers.some((e) => e.id === c.employeeId))
          );

          return (
            <div
              key={pod.id}
              onClick={() => setExpandedPodId(pod.id)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    {pod.id}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-1">{pod.name.split('—')[0]}</h3>
                  <p className="text-xs text-slate-500 truncate">{pod.name.split('—')[1] || ''}</p>
                </div>
                {podConflicts.length > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-3 h-3" /> {podConflicts.length}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Optimal
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pod Lead</span>
                  <span className="font-bold text-slate-800">{pod.leadName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Staff Count</span>
                  <span className="font-bold text-slate-800">
                    {podMembers.length} staff • {podBrands.length} brands
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Pod Detailed Roster Table */}
      {(() => {
        const currentPod = pods.find((p) => p.id === expandedPodId) || pods[0];
        if (!currentPod) return null;

        const podMembers = employees.filter((e) => e.podId === currentPod.id);
        const podBrands = brands.filter((b) => b.podId === currentPod.id);

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{currentPod.name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                    Lead: {currentPod.leadName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentPod.description}</p>
              </div>

              <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium">
                {podMembers.length} Members • {podBrands.length} Assigned Brands
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                    <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 min-w-[200px] font-bold shadow-xs">
                      Pod Member
                    </th>
                    <th className="px-3 py-3 font-semibold min-w-[120px]">Role / Skills</th>
                    <th className="px-3 py-3 font-semibold min-w-[140px]">Primary Brand</th>
                    {dates.map((dateStr) => {
                      const d = new Date(dateStr + 'T00:00:00');
                      return (
                        <th
                          key={dateStr}
                          className="px-1 py-2 text-center min-w-[40px] border-l border-slate-200"
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
                  {podMembers.map((emp) => {
                    const assignedBrand = brands.find((b) => b.primaryAssigneeIds.includes(emp.id));

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-slate-200 shadow-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {emp.name}
                            {emp.role === 'Pod Lead' && (
                              <Shield className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{emp.id}</div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="text-slate-800 font-medium">{emp.role}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {emp.skills.map((s) => (
                              <span
                                key={s}
                                className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          {assignedBrand ? (
                            <span className="font-semibold text-slate-800">{assignedBrand.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Pod Floater</span>
                          )}
                        </td>

                        {dates.map((dateStr) => {
                          const entry = roster.entries[emp.id]?.[dateStr];
                          if (!entry) return <td key={dateStr} className="text-center">-</td>;

                          let bg = 'bg-slate-100 text-slate-500';
                          let code = 'WO';

                          if (entry.status === 'WORKING') {
                            bg = 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200';
                            code = 'W';
                          } else if (entry.status === 'PLANNED_LEAVE' || entry.status === 'SICK_LEAVE') {
                            bg = 'bg-rose-100 text-rose-800 font-bold border border-rose-300';
                            code = 'L';
                          } else if (entry.status === 'COMP_OFF') {
                            bg = 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
                            code = 'CO';
                          } else if (entry.status === 'HOLIDAY_OFF') {
                            bg = 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
                            code = 'H';
                          }

                          return (
                            <td
                              key={dateStr}
                              onClick={() => onCellClick(emp.id, dateStr)}
                              className="px-1 py-1 text-center border-l border-slate-100 cursor-pointer"
                              title={`Click to edit ${emp.name} on ${dateStr}`}
                            >
                              <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-xs ${bg}`}>
                                {code}
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
        );
      })()}
    </div>
  );
};
