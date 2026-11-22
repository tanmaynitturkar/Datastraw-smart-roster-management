import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ChevronRight,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { SchedulingConflict } from '../types';

interface ConflictDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SchedulingConflict[];
  onResolveConflict: (conflict: SchedulingConflict) => void;
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
}) => {
  const [filter, setFilter] = React.useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  if (!isOpen) return null;

  const criticalCount = conflicts.filter((c) => c.severity === 'CRITICAL').length;
  const warningCount = conflicts.filter((c) => c.severity === 'WARNING').length;

  const filteredConflicts = conflicts.filter((c) => {
    if (filter === 'CRITICAL') return c.severity === 'CRITICAL';
    if (filter === 'WARNING') return c.severity === 'WARNING';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${criticalCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Conflict Detection & Validation Engine</h2>
              <p className="text-xs text-slate-500">
                Identifies scheduling conflicts, coverage gaps, and single-resource risks before publishing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Metrics */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({conflicts.length})
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                filter === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('WARNING')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                filter === 'WARNING'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Warnings ({warningCount})
            </button>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {conflicts.length === 0 ? '✨ All constraints satisfied' : 'Resolve issues to publish'}
          </span>
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {filteredConflicts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Zero Active Conflicts</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Every client operating requirement, minimum headcount, and employee leave constraint is satisfied.
                This roster is ready for final publication!
              </p>
            </div>
          ) : (
            filteredConflicts.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  c.severity === 'CRITICAL'
                    ? 'border-rose-200 border-l-4 border-l-rose-500'
                    : 'border-amber-200 border-l-4 border-l-amber-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          c.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.severity} • {c.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Date: {c.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                  {c.description}
                </p>

                {c.suggestedAction && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{c.suggestedAction.description}</span>
                    </div>

                    <button
                      onClick={() => onResolveConflict(c)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Quick Resolve</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Constraint Engine: Active Real-time Validation</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
