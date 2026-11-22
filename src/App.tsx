import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  MonthlyRoster,
  Employee,
  Brand,
  Pod,
  PublicHoliday,
  LeaveRequest,
  SchedulingConflict,
  DailyScheduleEntry,
} from './types';
import {
  INITIAL_PODS,
  INITIAL_EMPLOYEES,
  INITIAL_BRANDS,
  INITIAL_PUBLIC_HOLIDAYS,
  INITIAL_LEAVES,
} from './data/sampleData';
import { generateMonthlyRoster } from './engine/scheduler';
import { detectConflicts } from './engine/conflictDetector';
import { Navbar } from './components/Navbar';
import { ConflictDrawer } from './components/ConflictDrawer';
import { CompanyView } from './components/views/CompanyView';
import { PodView } from './components/views/PodView';
import { BrandView } from './components/views/BrandView';
import { ProcessView } from './components/views/ProcessView';
import { EmployeeView } from './components/views/EmployeeView';
import { EditShiftModal } from './components/modals/EditShiftModal';
import { ChangeSimulatorModal } from './components/modals/ChangeSimulatorModal';
import { AddEntityModal } from './components/modals/AddEntityModal';
import { DocumentationModal } from './components/modals/DocumentationModal';
import { exportRosterToCSV, exportRosterToJSON } from './utils/exportUtils';
import {
  Building2,
  Users,
  Store,
  Layers,
  User,
  AlertTriangle,
} from 'lucide-react';

export function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'POD' | 'BRAND' | 'PROCESS' | 'EMPLOYEE'>('COMPANY');
  const [currentMonth, setCurrentMonth] = useState<string>('2026-11');

  // Core Data State
  const [pods, setPods] = useState<Pod[]>(() => {
    const saved = localStorage.getItem('datastraw_pods');
    return saved ? JSON.parse(saved) : INITIAL_PODS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('datastraw_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('datastraw_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [holidays, setHolidays] = useState<PublicHoliday[]>(() => {
    const saved = localStorage.getItem('datastraw_holidays');
    return saved ? JSON.parse(saved) : INITIAL_PUBLIC_HOLIDAYS;
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('datastraw_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVES;
  });

  // Generated Roster State
  const [roster, setRoster] = useState<MonthlyRoster | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Modals & Panels
  const [isConflictDrawerOpen, setIsConflictDrawerOpen] = useState<boolean>(false);
  const [isSimulateChangeOpen, setIsSimulateChangeOpen] = useState<boolean>(false);
  const [isAddEntityOpen, setIsAddEntityOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    date: string;
  }>({
    isOpen: false,
    employeeId: '',
    date: '',
  });

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem('datastraw_pods', JSON.stringify(pods));
  }, [pods]);

  useEffect(() => {
    localStorage.setItem('datastraw_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('datastraw_brands', JSON.stringify(brands));
  }, [brands]);

  // Initial Roster Generation on Mount or Month Change
  useEffect(() => {
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;

    const initialRoster = generateMonthlyRoster(
      year,
      monthIndex,
      employees,
      brands,
      pods,
      holidays,
      leaves
    );
    setRoster(initialRoster);
  }, [currentMonth, employees, brands, pods, holidays, leaves]);

  // Handler: Generate Roster
  const handleGenerateRoster = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const [yearStr, monthStr] = currentMonth.split('-');
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1;

      const generated = generateMonthlyRoster(
        year,
        monthIndex,
        employees,
        brands,
        pods,
        holidays,
        leaves,
        roster?.entries,
        { autoAssignBackups: false, respectPreferences: true, enforceFairOffs: true }
      );
      setRoster(generated);
      setIsGenerating(false);

      if (generated.conflicts.length > 0) {
        setIsConflictDrawerOpen(true);
      } else {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
    }, 300);
  };

  // Handler: Publish Roster
  const handlePublishRoster = () => {
    if (!roster) return;
    if (roster.conflicts.some((c) => c.severity === 'CRITICAL')) {
      alert(
        'Cannot publish roster with unresolved CRITICAL coverage gaps. Please review and resolve conflicts first.'
      );
      setIsConflictDrawerOpen(true);
      return;
    }

    setRoster({ ...roster, status: 'PUBLISHED' });
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  };

  // Handler: Reset to Defaults
  const handleResetData = () => {
    if (confirm('Reset to initial sample dataset (32 employees, 16 brands, 4 pods)?')) {
      localStorage.clear();
      setPods(INITIAL_PODS);
      setEmployees(INITIAL_EMPLOYEES);
      setBrands(INITIAL_BRANDS);
      setHolidays(INITIAL_PUBLIC_HOLIDAYS);
      setLeaves(INITIAL_LEAVES);

      const [yearStr, monthStr] = currentMonth.split('-');
      const initialRoster = generateMonthlyRoster(
        parseInt(yearStr),
        parseInt(monthStr) - 1,
        INITIAL_EMPLOYEES,
        INITIAL_BRANDS,
        INITIAL_PODS,
        INITIAL_PUBLIC_HOLIDAYS,
        INITIAL_LEAVES
      );
      setRoster(initialRoster);
    }
  };

  // Handler: Cell Click Edit
  const handleCellClick = (employeeId: string, date: string) => {
    setEditModalState({
      isOpen: true,
      employeeId,
      date,
    });
  };

  // Handler: Save Shift Override
  const handleSaveShift = (updatedEntry: DailyScheduleEntry) => {
    if (!roster) return;

    const newEntries = { ...roster.entries };
    if (!newEntries[updatedEntry.employeeId]) {
      newEntries[updatedEntry.employeeId] = {};
    }
    newEntries[updatedEntry.employeeId][updatedEntry.date] = updatedEntry;

    // Re-detect conflicts
    const dates = Object.keys(newEntries[employees[0].id] || {}).sort();
    const newConflicts = detectConflicts(
      dates,
      employees,
      brands,
      pods,
      holidays,
      leaves,
      newEntries
    );

    setRoster({
      ...roster,
      entries: newEntries,
      conflicts: newConflicts,
      status: newConflicts.some((c) => c.severity === 'CRITICAL') ? 'DRAFT' : 'VALIDATED',
    });
  };

  // Handler: One-Click Quick Resolve Conflict
  const handleResolveConflict = (conflict: SchedulingConflict) => {
    if (!roster || !conflict.suggestedAction) return;

    const { actionType, candidateEmployeeId } = conflict.suggestedAction;

    if (actionType === 'ASSIGN_BACKUP' && candidateEmployeeId && conflict.brandId && conflict.processId) {
      const newEntries = { ...roster.entries };
      const currentEntry = newEntries[candidateEmployeeId]?.[conflict.date] || {
        employeeId: candidateEmployeeId,
        date: conflict.date,
        status: 'WORKING',
        shifts: [],
        notes: '',
      };

      currentEntry.status = 'WORKING';
      currentEntry.isManualOverride = true;
      currentEntry.shifts.push({
        brandId: conflict.brandId,
        processId: conflict.processId,
        hours: 4,
        isBackup: true,
      });
      currentEntry.notes = `Backup assignment covering for ${conflict.brandId} (${conflict.processId})`;

      newEntries[candidateEmployeeId][conflict.date] = currentEntry;

      const dates = Object.keys(newEntries[employees[0].id] || {}).sort();
      const newConflicts = detectConflicts(
        dates,
        employees,
        brands,
        pods,
        holidays,
        leaves,
        newEntries
      );

      setRoster({
        ...roster,
        entries: newEntries,
        conflicts: newConflicts,
        status: newConflicts.some((c) => c.severity === 'CRITICAL') ? 'DRAFT' : 'VALIDATED',
      });
    } else if (actionType === 'APPROVE_OVERRIDE' && conflict.employeeId) {
      // Revert employee to leave
      const newEntries = { ...roster.entries };
      const currentEntry = newEntries[conflict.employeeId]?.[conflict.date];
      if (currentEntry) {
        currentEntry.status = 'PLANNED_LEAVE';
        currentEntry.shifts = [];
        currentEntry.isManualOverride = true;
        currentEntry.notes = 'Approved leave honored';
      }

      const dates = Object.keys(newEntries[employees[0].id] || {}).sort();
      const newConflicts = detectConflicts(
        dates,
        employees,
        brands,
        pods,
        holidays,
        leaves,
        newEntries
      );

      setRoster({
        ...roster,
        entries: newEntries,
        conflicts: newConflicts,
        status: newConflicts.some((c) => c.severity === 'CRITICAL') ? 'DRAFT' : 'VALIDATED',
      });
    }
  };

  // Conflict Count
  const criticalConflicts = roster?.conflicts.filter((c) => c.severity === 'CRITICAL') || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        roster={roster}
        onGenerate={handleGenerateRoster}
        onPublish={handlePublishRoster}
        onOpenSimulateChange={() => setIsSimulateChangeOpen(true)}
        onOpenAddEntity={() => setIsAddEntityOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onExportCSV={() => roster && exportRosterToCSV(roster, employees, brands, pods)}
        onExportJSON={() => roster && exportRosterToJSON(roster)}
        onResetData={handleResetData}
        conflictCount={roster?.conflicts.length || 0}
        onToggleConflictDrawer={() => setIsConflictDrawerOpen(!isConflictDrawerOpen)}
        isGenerating={isGenerating}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Real-time Conflict Alert Strip (if any critical issues) */}
        {criticalConflicts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  {criticalConflicts.length} Critical Coverage Deficit(s) Flagged by Validation Engine
                </h4>
                <p className="text-[11px] text-rose-700">
                  Client operating requirements for single-resource brands or processes are currently unassigned.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSimulateChangeOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                Simulate Swap / Floater
              </button>
              <button
                onClick={() => setIsConflictDrawerOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
              >
                Review & Resolve
              </button>
            </div>
          </div>
        )}

        {/* 5-View Navigation Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('COMPANY')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COMPANY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Company-Wide Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('POD')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'POD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pod-Wise View</span>
            </button>

            <button
              onClick={() => setActiveTab('BRAND')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'BRAND'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Brand Coverage View</span>
            </button>

            <button
              onClick={() => setActiveTab('PROCESS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PROCESS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Process-Wise View</span>
            </button>

            <button
              onClick={() => setActiveTab('EMPLOYEE')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Employee Schedule Card</span>
            </button>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {employees.length} Employees • {brands.length} Brands • {pods.length} Operational Pods
          </div>
        </div>

        {/* View Component Display */}
        {roster && (
          <>
            {activeTab === 'COMPANY' && (
              <CompanyView
                roster={roster}
                employees={employees}
                brands={brands}
                pods={pods}
                holidays={holidays}
                onCellClick={handleCellClick}
              />
            )}

            {activeTab === 'POD' && (
              <PodView
                roster={roster}
                employees={employees}
                brands={brands}
                pods={pods}
                holidays={holidays}
                onCellClick={handleCellClick}
              />
            )}

            {activeTab === 'BRAND' && (
              <BrandView
                roster={roster}
                employees={employees}
                brands={brands}
                pods={pods}
                holidays={holidays}
              />
            )}

            {activeTab === 'PROCESS' && (
              <ProcessView roster={roster} employees={employees} brands={brands} />
            )}

            {activeTab === 'EMPLOYEE' && (
              <EmployeeView
                roster={roster}
                employees={employees}
                brands={brands}
                holidays={holidays}
                onCellClick={handleCellClick}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Slide-out Drawers */}
      <ConflictDrawer
        isOpen={isConflictDrawerOpen}
        onClose={() => setIsConflictDrawerOpen(false)}
        conflicts={roster?.conflicts || []}
        onResolveConflict={handleResolveConflict}
      />

      {roster && (
        <ChangeSimulatorModal
          isOpen={isSimulateChangeOpen}
          onClose={() => setIsSimulateChangeOpen(false)}
          roster={roster}
          employees={employees}
          brands={brands}
          pods={pods}
          holidays={holidays}
          leaves={leaves}
          onApplyResolution={(updated) => setRoster(updated)}
        />
      )}

      <AddEntityModal
        isOpen={isAddEntityOpen}
        onClose={() => setIsAddEntityOpen(false)}
        pods={pods}
        employees={employees}
        brands={brands}
        onAddEmployee={(newEmp) => setEmployees([...employees, newEmp])}
        onAddBrand={(newBrand) => setBrands([...brands, newBrand])}
        onAddPod={(newPod) => setPods([...pods, newPod])}
      />

      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {editModalState.isOpen && (
        <EditShiftModal
          isOpen={editModalState.isOpen}
          onClose={() => setEditModalState({ isOpen: false, employeeId: '', date: '' })}
          employeeId={editModalState.employeeId}
          date={editModalState.date}
          currentEntry={roster?.entries[editModalState.employeeId]?.[editModalState.date]}
          employees={employees}
          brands={brands}
          onSave={handleSaveShift}
        />
      )}
    </div>
  );
}

export default App;
