import React, { useState } from 'react';
import {
  Employee,
  Brand,
  DailyScheduleEntry,
  ShiftStatus,
  ProcessType,
  ShiftAssignment,
} from '../../types';
import { X, Check, Trash2, Plus, Clock, Briefcase } from 'lucide-react';

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
  currentEntry?: DailyScheduleEntry;
  employees: Employee[];
  brands: Brand[];
  onSave: (updatedEntry: DailyScheduleEntry) => void;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  date,
  currentEntry,
  employees,
  brands,
  onSave,
}) => {
  if (!isOpen) return null;

  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) return null;

  const [status, setStatus] = useState<ShiftStatus>(currentEntry?.status || 'WORKING');
  const [shifts, setShifts] = useState<ShiftAssignment[]>(
    currentEntry?.shifts && currentEntry.shifts.length > 0
      ? currentEntry.shifts
      : [
          {
            brandId: brands[0]?.id || '',
            processId: employee.skills[0] || 'CS',
            hours: 8,
          },
        ]
  );
  const [notes, setNotes] = useState<string>(currentEntry?.notes || '');

  const handleAddShift = () => {
    setShifts([
      ...shifts,
      {
        brandId: brands[0]?.id || '',
        processId: employee.skills[0] || 'CS',
        hours: 4,
      },
    ]);
  };

  const handleRemoveShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const handleUpdateShift = (index: number, key: keyof ShiftAssignment, value: any) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [key]: value };
    setShifts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      employeeId,
      date,
      status,
      shifts: status === 'WORKING' ? shifts : [],
      isManualOverride: true,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Shift Inspector & Override
            </span>
            <h3 className="text-lg font-bold text-slate-900">{employee.name}</h3>
            <p className="text-xs text-slate-500">
              {date} • {employee.podId} • {employee.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Daily Schedule Status
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(
                [
                  ['WORKING', 'Working', 'bg-indigo-50 border-indigo-300 text-indigo-700'],
                  ['WEEKLY_OFF', 'Weekly Off', 'bg-slate-50 border-slate-300 text-slate-700'],
                  ['PLANNED_LEAVE', 'Planned Leave', 'bg-rose-50 border-rose-300 text-rose-700'],
                  ['COMP_OFF', 'Comp-Off', 'bg-amber-50 border-amber-300 text-amber-700'],
                  ['SICK_LEAVE', 'Sick Leave', 'bg-orange-50 border-orange-300 text-orange-700'],
                  ['HOLIDAY_OFF', 'Holiday Off', 'bg-emerald-50 border-emerald-300 text-emerald-700'],
                ] as const
              ).map(([val, label, style]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStatus(val)}
                  className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                    status === val ? `${style} ring-2 ring-indigo-500 shadow-xs` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Shifts Allocation (when status is WORKING) */}
          {status === 'WORKING' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  Assigned Brands & Operational Processes
                </label>
                <button
                  type="button"
                  onClick={handleAddShift}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Process
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {shifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2"
                  >
                    {/* Brand Select */}
                    <select
                      value={shift.brandId}
                      onChange={(e) => handleUpdateShift(idx, 'brandId', e.target.value)}
                      className="text-xs border border-slate-300 rounded-md p-1.5 flex-1 bg-white font-medium"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    {/* Process Select */}
                    <select
                      value={shift.processId}
                      onChange={(e) =>
                        handleUpdateShift(idx, 'processId', e.target.value as ProcessType)
                      }
                      className="text-xs border border-slate-300 rounded-md p-1.5 w-24 bg-white font-semibold"
                    >
                      <option value="CS">CS</option>
                      <option value="ACC">ACC</option>
                      <option value="Retention">Retention</option>
                      <option value="NDR">NDR</option>
                      <option value="CatalogOps">Catalog</option>
                    </select>

                    {/* Hours */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={shift.hours}
                        onChange={(e) =>
                          handleUpdateShift(idx, 'hours', parseInt(e.target.value) || 0)
                        }
                        className="w-12 text-xs border border-slate-300 rounded-md p-1.5 text-center font-bold"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">hrs</span>
                    </div>

                    {shifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Operational Notes / Reason for Change
            </label>
            <input
              type="text"
              placeholder="e.g. Approved swap, client request, or emergency coverage"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save & Re-Validate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
