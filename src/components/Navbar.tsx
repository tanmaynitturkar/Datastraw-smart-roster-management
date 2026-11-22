import React from 'react';
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  Download,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  SlidersHorizontal,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { MonthlyRoster, RosterStateStatus } from '../types';

interface NavbarProps {
  currentMonth: string; // '2026-11'
  onMonthChange: (month: string) => void;
  roster: MonthlyRoster | null;
  onGenerate: () => void;
  onPublish: () => void;
  onOpenSimulateChange: () => void;
  onOpenAddEntity: () => void;
  onOpenDocs: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onResetData: () => void;
  conflictCount: number;
  onToggleConflictDrawer: () => void;
  isGenerating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onMonthChange,
  roster,
  onGenerate,
  onPublish,
  onOpenSimulateChange,
  onOpenAddEntity,
  onOpenDocs,
  onExportCSV,
  onExportJSON,
  onResetData,
  conflictCount,
  onToggleConflictDrawer,
  isGenerating,
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const getStatusBadge = (status?: RosterStateStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Published
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <FileCheck2 className="w-3.5 h-3.5" /> Validated (Ready)
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Draft (Has Conflicts)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">DataStraw</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Smart Roster OS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Operations Scheduling & Constraint Solver</p>
            </div>
          </div>

          {/* Month Selector & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-sm">
              <span className="px-2.5 py-1 font-semibold text-slate-700">Month:</span>
              <select
                value={currentMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-2.5 py-1 font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2026-11">November 2026 (Live Evaluation)</option>
                <option value="2026-12">December 2026 (Upcoming)</option>
                <option value="2027-01">January 2027 (Q1 Plan)</option>
              </select>
            </div>

            {roster && getStatusBadge(roster.status)}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Conflict Pill Button */}
            <button
              onClick={onToggleConflictDrawer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                conflictCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${conflictCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
              <span>{conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}</span>
            </button>

            {/* Change Simulator Button */}
            <button
              onClick={onOpenSimulateChange}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors"
              title="Test unplanned employee leaves, absences or brand requirement shifts"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
              <span>Handle Change</span>
            </button>

            {/* Add Entity Button */}
            <button
              onClick={onOpenAddEntity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
              title="Add Brand, Employee, or Pod dynamically"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Entity</span>
            </button>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving...' : 'Generate Roster'}</span>
            </button>

            {/* Publish Button */}
            {roster && roster.status !== 'PUBLISHED' && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Export Roster"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <button
                    onClick={() => {
                      onExportCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Export to CSV</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportJSON();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Export to JSON</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Raw Data</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Data */}
            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Reset to Sample Dataset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* System Brief / Documentation */}
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="View Architecture & Tell Us How You Think answers"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Assessment Brief</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
