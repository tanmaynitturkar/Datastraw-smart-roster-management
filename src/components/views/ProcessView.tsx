import React, { useState } from 'react';
import { MonthlyRoster, Employee, Brand, ProcessType } from '../../types';
import { PROCESS_CONFIG } from '../../data/sampleData';
import { Layers, Activity, Users } from 'lucide-react';

interface ProcessViewProps {
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
}

export const ProcessView: React.FC<ProcessViewProps> = ({ roster, employees, brands }) => {
  const [selectedProcess, setSelectedProcess] = useState<ProcessType>('CS');
  const dates = Object.keys(roster.entries[employees[0]?.id] || {}).sort();

  const processes: ProcessType[] = ['CS', 'ACC', 'Retention', 'NDR', 'CatalogOps'];

  return (
    <div className="space-y-6">
      {/* Process Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {processes.map((proc) => {
          const config = PROCESS_CONFIG[proc];
          const isSelected = selectedProcess === proc;
          const qualifiedEmployees = employees.filter((e) => e.skills.includes(proc));

          return (
            <button
              key={proc}
              onClick={() => setSelectedProcess(proc)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.badge}`}>
                  {proc}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {qualifiedEmployees.length} Qualified
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{config.name}</h4>
            </button>
          );
        })}
      </div>

      {/* Selected Process Schedule Matrix */}
      {(() => {
        const qualifiedEmployees = employees.filter((e) => e.skills.includes(selectedProcess));
        const procConfig = PROCESS_CONFIG[selectedProcess];

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{procConfig.name} Staffing Timeline</h3>
                <p className="text-xs text-slate-500">
                  Monitoring daily deployment for {qualifiedEmployees.length} qualified specialists
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                    <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 min-w-[200px] font-bold shadow-xs">
                      Qualified Specialist
                    </th>
                    <th className="px-3 py-3 font-semibold min-w-[120px]">Pod & Role</th>
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
                  {/* Daily Active Headcount Summary Row */}
                  <tr className="bg-indigo-50/60 font-bold border-b border-indigo-100">
                    <td className="sticky left-0 z-10 bg-indigo-50 px-4 py-2 text-indigo-900 border-r border-indigo-200">
                      Total Active on {selectedProcess}
                    </td>
                    <td className="px-3 py-2 text-indigo-700 text-[11px]">Daily Deployed</td>
                    {dates.map((dateStr) => {
                      const activeCount = qualifiedEmployees.filter((emp) => {
                        const entry = roster.entries[emp.id]?.[dateStr];
                        return (
                          entry?.status === 'WORKING' &&
                          entry.shifts.some((s) => s.processId === selectedProcess)
                        );
                      }).length;

                      return (
                        <td
                          key={dateStr}
                          className="px-1 py-2 text-center border-l border-indigo-100 text-indigo-900 font-bold"
                        >
                          {activeCount}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Employee Rows */}
                  {qualifiedEmployees.map((emp) => {
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-slate-200 shadow-xs">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[11px] text-slate-500">{emp.id}</div>
                        </td>

                        <td className="px-3 py-2.5 text-slate-700">
                          <div>{emp.podId}</div>
                          <div className="text-[10px] text-slate-400">{emp.role}</div>
                        </td>

                        {dates.map((dateStr) => {
                          const entry = roster.entries[emp.id]?.[dateStr];
                          const isAssignedToThisProcess =
                            entry?.status === 'WORKING' &&
                            entry.shifts.some((s) => s.processId === selectedProcess);

                          return (
                            <td
                              key={dateStr}
                              className="px-1 py-1 text-center border-l border-slate-100"
                            >
                              {isAssignedToThisProcess ? (
                                <div className="w-7 h-7 mx-auto rounded flex items-center justify-center font-bold text-xs bg-indigo-100 text-indigo-800 border border-indigo-300">
                                  ✓
                                </div>
                              ) : entry?.status === 'WORKING' ? (
                                <div
                                  className="w-7 h-7 mx-auto rounded flex items-center justify-center text-[10px] bg-slate-100 text-slate-500"
                                  title="Working on other brand process today"
                                >
                                  -
                                </div>
                              ) : (
                                <div
                                  className="w-7 h-7 mx-auto rounded flex items-center justify-center text-[10px] text-slate-300"
                                  title={entry?.status || 'Off'}
                                >
                                  •
                                </div>
                              )}
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
