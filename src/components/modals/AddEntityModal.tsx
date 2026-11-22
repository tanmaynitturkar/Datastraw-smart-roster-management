import React, { useState } from 'react';
import { Employee, Brand, Pod, OperatingCalendarType, ProcessType } from '../../types';
import { X, Plus, Building, User, Users } from 'lucide-react';

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pods: Pod[];
  employees: Employee[];
  brands: Brand[];
  onAddEmployee: (employee: Employee) => void;
  onAddBrand: (brand: Brand) => void;
  onAddPod: (pod: Pod) => void;
}

export const AddEntityModal: React.FC<AddEntityModalProps> = ({
  isOpen,
  onClose,
  pods,
  employees,
  brands,
  onAddEmployee,
  onAddBrand,
  onAddPod,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'BRAND' | 'POD'>('EMPLOYEE');

  // New Employee State
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPod, setEmpPod] = useState(pods[0]?.id || 'pod-alpha');
  const [empRole, setEmpRole] = useState<'Operations Specialist' | 'Senior Specialist' | 'Pod Lead'>('Operations Specialist');
  const [empSkills, setEmpSkills] = useState<ProcessType[]>(['CS', 'NDR']);
  const [empOffDays, setEmpOffDays] = useState<number[]>([0, 6]);

  // New Brand State
  const [brandName, setBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState('');
  const [brandPod, setBrandPod] = useState(pods[0]?.id || 'pod-alpha');
  const [brandCalendar, setBrandCalendar] = useState<OperatingCalendarType>('365_DAYS');
  const [isSingleResource, setIsSingleResource] = useState(true);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  // New Pod State
  const [podName, setPodName] = useState('');
  const [podLeadId, setPodLeadId] = useState(employees[0]?.id || 'EMP001');
  const [podDesc, setPodDesc] = useState('');

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    const newEmp: Employee = {
      id: `EMP0${employees.length + 1}`,
      name: empName,
      email: empEmail || `${empName.toLowerCase().replace(/\s+/g, '.')}@datastraw.io`,
      podId: empPod,
      role: empRole,
      skills: empSkills,
      contractedWeeklyOffs: 2,
      preferredOffDays: empOffDays,
      maxConsecutiveDays: 6,
      isDedicatedSolo: isSingleResource,
      avatarBg: 'bg-indigo-600',
    };

    onAddEmployee(newEmp);
    onClose();
  };

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName) return;

    const newBrand: Brand = {
      id: `BRD-0${brands.length + 1}`,
      name: brandName,
      podId: brandPod,
      category: brandCategory || 'Direct-to-Consumer',
      operatingCalendar: brandCalendar,
      isSingleResource,
      primaryAssigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [employees[0]?.id || 'EMP001'],
      requiredProcesses: [
        { processId: 'CS', minStaffingWeekday: 1, minStaffingWeekend: 1, minStaffingHoliday: 1 },
      ],
    };

    onAddBrand(newBrand);
    onClose();
  };

  const handleCreatePod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podName) return;

    const leadEmp = employees.find((e) => e.id === podLeadId);
    const newPod: Pod = {
      id: `pod-${podName.toLowerCase().replace(/\s+/g, '-')}`,
      name: podName,
      leadId: podLeadId,
      leadName: leadEmp?.name || 'Assigned Lead',
      description: podDesc || 'Newly created operational pod unit',
    };

    onAddPod(newPod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Dynamic Configuration (No Code Change)
            </span>
            <h3 className="text-base font-bold text-slate-900">Add Operational Resource</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('EMPLOYEE')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'EMPLOYEE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" /> Add Employee
          </button>
          <button
            onClick={() => setActiveTab('BRAND')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'BRAND'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building className="w-4 h-4" /> Add Client Brand
          </button>
          <button
            onClick={() => setActiveTab('POD')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'POD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" /> Add Operational Pod
          </button>
        </div>

        {/* Tab 1: Add Employee Form */}
        {activeTab === 'EMPLOYEE' && (
          <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="e.g. Radhika Sharma"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Pod</label>
                <select
                  value={empPod}
                  onChange={(e) => setEmpPod(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.split('—')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  <option value="Operations Specialist">Operations Specialist</option>
                  <option value="Senior Specialist">Senior Specialist</option>
                  <option value="Pod Lead">Pod Lead</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Process Skills (Hold Ctrl / Command to multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {(['CS', 'ACC', 'Retention', 'NDR', 'CatalogOps'] as ProcessType[]).map((proc) => {
                  const isChecked = empSkills.includes(proc);
                  return (
                    <button
                      key={proc}
                      type="button"
                      onClick={() =>
                        setEmpSkills(
                          isChecked
                            ? empSkills.filter((s) => s !== proc)
                            : [...empSkills, proc]
                        )
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {proc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Employee & Update Roster
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Add Brand Form */}
        {activeTab === 'BRAND' && (
          <form onSubmit={handleCreateBrand} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. ZenFit Athleisure"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Calendar</label>
                <select
                  value={brandCalendar}
                  onChange={(e) => setBrandCalendar(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  <option value="365_DAYS">365 Days (24/7)</option>
                  <option value="DAILY_EXCEPT_HOLIDAYS">Daily (Excl Holidays)</option>
                  <option value="MON_SAT_EXCEPT_HOLIDAYS">Mon–Sat (Excl Holidays)</option>
                  <option value="MON_FRI_EXCEPT_HOLIDAYS">Mon–Fri (Excl Holidays)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Pod</label>
                <select
                  value={brandPod}
                  onChange={(e) => setBrandPod(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.split('—')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staffing Model</label>
              <div className="flex gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="staffModel"
                    checked={isSingleResource}
                    onChange={() => setIsSingleResource(true)}
                  />
                  <span>Single Dedicated Employee (~80% model)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="staffModel"
                    checked={!isSingleResource}
                    onChange={() => setIsSingleResource(false)}
                  />
                  <span>Multi-Employee Team (~20% model)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Specialist
              </label>
              <select
                value={selectedAssigneeIds[0] || ''}
                onChange={(e) => setSelectedAssigneeIds([e.target.value])}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id} - {e.podId})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Brand & Configure
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Add Pod Form */}
        {activeTab === 'POD' && (
          <form onSubmit={handleCreatePod} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pod Name</label>
              <input
                type="text"
                required
                value={podName}
                onChange={(e) => setPodName(e.target.value)}
                placeholder="e.g. Pod Epsilon — Quick Commerce & Groceries"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designated Pod Lead</label>
              <select
                value={podLeadId}
                onChange={(e) => setPodLeadId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id} - {e.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pod Scope & Operations</label>
              <textarea
                value={podDesc}
                onChange={(e) => setPodDesc(e.target.value)}
                placeholder="Describe operational focus and domain coverage..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium h-20"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Pod
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
