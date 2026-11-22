import React, { useState } from 'react';
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
  Building2,
  Users,
  Store,
  Layers,
  User,
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
  activeTab: 'COMPANY' | 'POD' | 'BRAND' | 'PROCESS' | 'EMPLOYEE';
  onTabChange: (tab: 'COMPANY' | 'POD' | 'BRAND' | 'PROCESS' | 'EMPLOYEE') => void;
  employeeCount: number;
  brandCount: number;
  podCount: number;
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
  activeTab,
  onTabChange,
  employeeCount,
  brandCount,
  podCount,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getStatusBadge = (status?: RosterStateStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap shrink-0">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Validated (Ready)
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Draft (Has Conflicts)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Upper Tier: Brand Identity, Month Selector, Status, and Utility Controls */}
      <div className="w-full px-4 sm:px-6 lg:px-8 border-b border-slate-100 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Brand + Month + Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap">
                DataStraw
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                Smart Roster OS
              </span>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-slate-200 mx-1 shrink-0" />

            {/* Month Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-200 text-xs shrink-0">
              <span className="font-semibold text-slate-500 mr-1.5 whitespace-nowrap">Month:</span>
              <select
                value={currentMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="2026-11">November 2026</option>
                <option value="2026-12">December 2026</option>
                <option value="2027-01">January 2027</option>
              </select>
            </div>

            {/* Status Badge */}
            {roster && getStatusBadge(roster.status)}
          </div>

          {/* Right: Secondary Utilities & Documentation */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Add Entity */}
            <button
              onClick={onOpenAddEntity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors whitespace-nowrap"
              title="Add Brand, Employee, or Pod dynamically without code changes"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Entity</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                title="Export Roster"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
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
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                      Sheets
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onExportJSON();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Export to JSON</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                      Raw Data
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Data */}
            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Reset to 32 Employee Sample Dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Assessment Brief */}
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap shadow-2xs"
              title="View Architecture & Tell Us How You Think answers"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Assessment Brief</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lower Tier: 5 Stakeholder Views & Primary Operational Actions */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: 5 Stakeholder Views Tab Bar */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <button
              onClick={() => onTabChange('COMPANY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'COMPANY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company-Wide Matrix</span>
            </button>

            <button
              onClick={() => onTabChange('POD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'POD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pod-Wise View</span>
            </button>

            <button
              onClick={() => onTabChange('BRAND')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'BRAND'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Brand Coverage View</span>
            </button>

            <button
              onClick={() => onTabChange('PROCESS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'PROCESS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Process-Wise View</span>
            </button>

            <button
              onClick={() => onTabChange('EMPLOYEE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Employee Schedule Card</span>
            </button>
          </div>

          {/* Right: Operational Triggers (Conflict Pill, Handle Change, Generate, Publish) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Conflict Pill Button */}
            <button
              onClick={onToggleConflictDrawer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                conflictCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  conflictCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                }`}
              />
              <span>
                {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}
              </span>
            </button>

            {/* Handle Change Simulator Button */}
            <button
              onClick={onOpenSimulateChange}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors whitespace-nowrap shadow-2xs"
              title="Test unplanned employee leaves, absences or brand requirement shifts (Section 3.F)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
              <span>Handle Change</span>
            </button>

            {/* Generate Roster Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving...' : 'Generate Roster'}</span>
            </button>

            {/* Publish Button */}
            {roster && roster.status !== 'PUBLISHED' && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
