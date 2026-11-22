import React from 'react';
import { X, BookOpen, CheckCircle, Code, Shield, Cpu, HelpCircle } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                DataStraw Technical Assessment
              </span>
              <h2 className="text-lg font-bold">Architecture Note & "Tell Us How You Think"</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Executive Overview */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">1. Approach & Architecture Note</h3>
            <p>
              The DataStraw Smart Roster Management System is architected around a deterministic 
              Constraint-Satisfaction Solver coupled with real-time heuristic validation and dynamic 
              pod-level resilience. The solution decouples the <strong>Client Brand Operating Calendar</strong> (which 
              dictates 365-day, Mon-Sat, or Mon-Fri business obligations) from the <strong>Employee Work 
              Schedule</strong> (which enforces contractual weekly offs, maximum consecutive days, and statutory leave 
              rights).
            </p>
          </section>

          {/* 8 Questions Answered */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Answers to "Tell Us How You Think" (PDF Section 8)
            </h3>

            {/* Q1 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q1: How did you model employees, brands, processes, pods, and their relationships?
              </h4>
              <p>
                We established a normalized, relational domain model:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Pod:</strong> Grouping unit containing an appointed Pod Lead and assigned specialist employees. Serves as the first-order resource boundary for backup dispatch.</li>
                <li><strong>Employee:</strong> Independent entity with skill proficiencies (<code>CS</code>, <code>ACC</code>, <code>Retention</code>, <code>NDR</code>, <code>CatalogOps</code>), contracted weekly offs (typically 2 days/week), preferred rest days, and consecutive work limits (max 6 days).</li>
                <li><strong>Brand:</strong> Configured with its category, pod assignment, operating calendar (<code>365_DAYS</code>, <code>DAILY_EXCEPT_HOLIDAYS</code>, <code>MON_SAT_EXCEPT_HOLIDAYS</code>, <code>MON_FRI_EXCEPT_HOLIDAYS</code>), and per-process minimum staffing rules.</li>
                <li><strong>Assignments & Relationships:</strong> Multi-tiered mapping where an employee can be a dedicated solo resource for a brand (~81% in sample data) or part of a multi-specialist pod pod team (~19%).</li>
              </ul>
            </div>

            {/* Q2 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q2: How does your system generate a roster and determine whether it satisfies the required constraints?
              </h4>
              <p>
                The generator evaluates every day of the target month through an ordered constraint pipeline:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Hard Constraint 1 (Approved Absences):</strong> Approved leaves, comp-offs, and sick leaves are locked first. No shifts are scheduled on these days.</li>
                <li><strong>Hard Constraint 2 (Brand Operating Calendars):</strong> On days where a client brand is closed (e.g. Mon-Fri brand on a Sunday), employees are placed on weekly off or holiday.</li>
                <li><strong>Hard Constraint 3 (Consecutive Working Limits):</strong> If an employee reaches 6 consecutive work days, a rest day is strictly mandated.</li>
                <li><strong>Soft Constraints & Optimization:</strong> Staggering weekly offs among multi-employee teams to preserve continuous coverage, while respecting employee preferred rest days where possible.</li>
                <li><strong>Validation Pass:</strong> A comprehensive scanner calculates active headcount against required minimums for every brand and process, classifying any deficit into Critical Gaps, Single-Resource Risks, or Leave Collisions.</li>
              </ol>
            </div>

            {/* Q3 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q3: How did you handle the difference between single-resource brands and brands with multiple employees?
              </h4>
              <p>
                <strong>Single-Resource Brands:</strong> The assigned specialist is the default single point of failure (SPOF). When that employee is off (weekly off, leave, or holiday), the system flags a <em>Single-Resource Gap</em> unless an explicit backup is designated. 
              </p>
              <p>
                <strong>Multi-Employee Brands:</strong> The engine staggers weekly offs across the team (e.g., Emp A off Mon-Tue, Emp B off Wed-Thu, Emp C off Sat-Sun). When an employee is absent, the system first evaluates <em>Internal Pod Absorption</em>—checking if the remaining team members hold the requisite skills to maintain minimum coverage before alerting for external floaters.
              </p>
            </div>

            {/* Q4 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q4: What happens when an employee manages all processes for a brand but is unavailable on a required working day?
              </h4>
              <p>
                The system immediately raises a <strong>🔴 CRITICAL SINGLE_RESOURCE_GAP</strong>. Instead of silently failing or dropping client operations, the engine:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Generates an explicit plain-language diagnostic explaining which client brand and processes are completely unattended.</li>
                <li>Scans peers within the same operational pod with matching skill sets.</li>
                <li>Ranks candidates by pod familiarity, skill match, and workload capacity.</li>
                <li>Provides a one-click "Quick Resolve" button allowing the operations manager to deploy the top-ranked backup floater seamlessly.</li>
              </ul>
            </div>

            {/* Q5 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q5: How does your system handle conflicting requirements or insufficient staffing?
              </h4>
              <p>
                We enforce a strict hierarchy: <strong>Client Mandatory Operating Coverage &gt; Statutory Employee Leave &gt; Preferred Weekly Off Days</strong>. If a conflict is mathematically unresolvable with the existing pool:
              </p>
              <p>
                The system keeps the roster in <strong>DRAFT</strong> status, preventing accidental publishing. The Conflict Drawer highlights the exact deficits, explains the root cause, and presents recommended compensatory actions (overtime swaps, comp-off conversions, or cross-pod floater dispatch).
              </p>
            </div>

            {/* Q6 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q6: Which parts of the process did you automate, and which did you leave under human control? Why?
              </h4>
              <p>
                <strong>Automated:</strong> Base roster construction, shift staggering, constraint validation, streak tracking, holiday deductions, candidate backup scoring, and conflict detection. These are computationally intensive and error-prone when done manually across 30+ staff.
              </p>
              <p>
                <strong>Human-Controlled:</strong> Final publication approval, approval of emergency leave exceptions, and confirmation of cross-pod backup swaps. Operational context (e.g. employee interpersonal preferences or sudden client volume surges) requires human management discretion.
              </p>
            </div>

            {/* Q7 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q7: If the company doubled its team and brand count, what would you change about your solution?
              </h4>
              <p>
                At 60+ employees and 30+ brands, we would:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Migrate the client-side solver to an asynchronous background worker using Google OR-Tools or a WebWorker/WASM solver for sub-second optimization.</li>
                <li>Introduce dedicated "Floater / Shadow Specialist" pools assigned at the Pod level specifically to buffer single-resource brands without disrupting primary brand assignments.</li>
                <li>Implement automated shift bidding / peer swap marketplace where employees can request swaps that are auto-validated against brand coverage rules before manager sign-off.</li>
              </ul>
            </div>

            {/* Q8 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs text-indigo-700">
                Q8: If you had one additional week to work on this, what would you improve first?
              </h4>
              <p>
                We would prioritize:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Interactive Drag-and-Drop Shift Swapper:</strong> Visual calendar dragging with real-time shadow validation showing green/red drop zones.</li>
                <li><strong>Multi-Channel Notifications:</strong> Automated Slack / WhatsApp / Email webhooks notifying employees when monthly rosters or approved shifts change.</li>
                <li><strong>Google Calendar & HRMS Integration:</strong> Two-way synchronization with BambooHR/Keka for auto-syncing approved leaves, and iCal feed export for employee phone calendars.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            DataStraw Assessment Deliverables Complete
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
