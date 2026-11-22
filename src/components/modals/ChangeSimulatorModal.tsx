import React, { useState } from 'react';
import {
  MonthlyRoster,
  Employee,
  Brand,
  PublicHoliday,
  BackupRecommendation,
} from '../../types';
import {
  analyzeEmployeeAbsence,
  applyChangeResolution,
  ChangeImpactAnalysis,
} from '../../engine/changeSimulator';
import {
  X,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ChangeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: MonthlyRoster;
  employees: Employee[];
  brands: Brand[];
  pods: any[];
  holidays: PublicHoliday[];
  leaves: any[];
  onApplyResolution: (updatedRoster: MonthlyRoster) => void;
}

export const ChangeSimulatorModal: React.FC<ChangeSimulatorModalProps> = ({
  isOpen,
  onClose,
  roster,
  employees,
  brands,
  pods,
  holidays,
  leaves,
  onApplyResolution,
}) => {
  if (!isOpen) return null;

  // Selected State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP018'); // Ananya Iyer (PureGlow single resource)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-14');
  const [absenceType, setAbsenceType] = useState<'PLANNED_LEAVE' | 'SICK_LEAVE' | 'WEEKLY_OFF' | 'COMP_OFF'>('PLANNED_LEAVE');
  const [reason, setReason] = useState<string>('Emergency family obligation');
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');

  // Run impact analysis
  const impactAnalysis: ChangeImpactAnalysis = React.useMemo(() => {
    try {
      return analyzeEmployeeAbsence(
        selectedEmpId,
        selectedDate,
        roster,
        employees,
        brands,
        holidays
      );
    } catch (e) {
      return {
        employeeId: selectedEmpId,
        date: selectedDate,
        previousStatus: 'WORKING',
        affectedBrands: [],
        backupRecommendations: [],
        summary: 'No active shift impact.',
      };
    }
  }, [selectedEmpId, selectedDate, roster, employees, brands, holidays]);

  const handleApply = () => {
    const updated = applyChangeResolution(
      roster,
      selectedEmpId,
      selectedDate,
      absenceType,
      reason,
      selectedBackupId || undefined,
      employees,
      brands,
      pods,
      holidays,
      leaves
    );
    onApplyResolution(updated);
    onClose();
  };

  // Quick preset loader
  const loadPreset = (preset: 'SOLO' | 'MULTI') => {
    if (preset === 'SOLO') {
      setSelectedEmpId('EMP018'); // Ananya Iyer (Single-resource for PureGlow 365-day brand)
      setSelectedDate('2026-11-14');
      setAbsenceType('PLANNED_LEAVE');
      setReason('Emergency leave for family commitment');
      setSelectedBackupId('');
    } else {
      setSelectedEmpId('EMP006'); // Manish Tiwari (1 of 3 for NovaKart)
      setSelectedDate('2026-11-18');
      setAbsenceType('COMP_OFF');
      setReason('Compensatory off for festival weekend sprint');
      setSelectedBackupId('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-indigo-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Requirement 3.F Dynamic Engine
              </span>
              <h2 className="text-lg font-bold">Roster Change Simulator & Backup Resolution</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Presets */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Test Assignment Scenarios:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadPreset('SOLO')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors"
              >
                1. Single-Resource Gap (PureGlow)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('MULTI')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-violet-700 border border-violet-200 shadow-2xs hover:bg-violet-50 transition-colors"
              >
                2. Multi-Resource Absence (NovaKart)
              </button>
            </div>
          </div>

          {/* Change Config Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Absent Employee
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setSelectedBackupId('');
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.isDedicatedSolo ? 'Solo' : e.podId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Absence</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                {Object.keys(roster.entries[employees[0]?.id] || {}).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Absence Type</label>
              <select
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                <option value="PLANNED_LEAVE">Planned Leave</option>
                <option value="SICK_LEAVE">Sick / Emergency Leave</option>
                <option value="WEEKLY_OFF">Unplanned Weekly Off</option>
              </select>
            </div>
          </div>

          {/* Impact Analysis Results */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Automated Coverage & Operational Impact Assessment
            </h3>

            {impactAnalysis.affectedBrands.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                This employee was already scheduled off or on leave on {selectedDate}. No operational brand coverage deficit.
              </div>
            ) : (
              impactAnalysis.affectedBrands.map((ab) => (
                <div
                  key={ab.brand.id}
                  className={`p-4 rounded-xl border ${
                    ab.canRemainingStaffCover
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ab.brand.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border">
                          {ab.isSingleResource ? 'Single-Resource Brand' : 'Multi-Resource Team'}
                        </span>
                      </div>
                      <p className="text-xs mt-1.5 leading-relaxed font-mono">{ab.explanation}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      {ab.canRemainingStaffCover ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Self-Sustaining
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> Coverage Gap
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Backup Recommendations (if gap exists) */}
          {impactAnalysis.backupRecommendations.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Recommended Pod Backup Candidates
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ranked by pod alignment, skillset match, and current workload capacity
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  Select candidate to deploy
                </span>
              </div>

              <div className="space-y-2">
                {impactAnalysis.backupRecommendations.map((rec) => {
                  const isSelected = selectedBackupId === rec.employee.id;

                  return (
                    <div
                      key={rec.employee.id}
                      onClick={() => setSelectedBackupId(rec.employee.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="backupRadio"
                            checked={isSelected}
                            onChange={() => setSelectedBackupId(rec.employee.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{rec.employee.name}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({rec.employee.role} • {rec.employee.podId})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {rec.reasons.join(' | ')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Match Score: {rec.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Apply Resolution & Update Roster</span>
          </button>
        </div>
      </div>
    </div>
  );
};
