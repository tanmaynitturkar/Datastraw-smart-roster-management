# DataStraw Smart Roster Management System 📅⚡

> Hiring Assignment: Build a Smart Roster Management System  
> **Company**: DataStraw Tech Internship Assessment  
> **Stack**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Canvas Confetti  
> **Repository**: [GitHub Repository](https://github.com/tanmaynitturkar/Datastraw-smart-roster-management)  
> **Live Demo**: [Deployed Application](https://datastraw-smart-roster.vercel.app)  

---

## 🚀 Executive Summary

The **DataStraw Smart Roster Management System** is a purpose-built operational scheduling platform designed for modern customer experience & operational pods managing multiple D2C client brands.

Unlike a naive calendar or digitized spreadsheet, this system solves the underlying combinatorial scheduling problem:
- Decouples **Client Operating Calendars** (365 days, Mon-Sat, Mon-Fri, Public Holiday rules) from **Employee Rest Schedules** (statutory weekly offs, consecutive day limits, planned leaves, comp-offs).
- Models realistic staffing asymmetries: **81.25% single-resource brands** (where 1 employee handles all client processes) alongside **18.75% multi-resource teams** (with separate or overlapping process ownership).
- Features an automated **Constraint-Satisfaction Solver** with sub-second execution.
- Employs a real-time **Conflict Detection & Validation Engine** that identifies coverage gaps and single-point-of-failure risks before publishing.
- Includes a dedicated **Change Simulator** to demonstrate resilience when an employee takes unexpected leave or client requirements shift.
- Provides **5 distinct stakeholder views**: Company-Wide, Pod-Wise, Brand-Wise, Process-Wise, and Employee-Wise.

---

## 🛠️ Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v22.21.1)
- **npm**: v9.0.0 or higher (Tested on npm 11.6.4)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/tanmaynitturkar/Datastraw-smart-roster-management.git
cd Datastraw-smart-roster-management

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build & Preview

```bash
# Build optimized static bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Architecture & Core Problem Formulation

### 1. The Operational Challenge
Managing schedules for 30+ employees across 16+ D2C brands creates complex interdependencies:
- A single employee on weekly off can leave an entire brand's customer support completely unstaffed.
- Public holidays require selective staffing based on client contract tier (e.g. 365-day brands operate continuously, whereas Mon-Fri brands observe holidays).
- Statutory limits mandate rest days after at most 6 consecutive working days.
- Overlapping processes across multi-employee brands require staggered off-days to avoid simultaneous absences.

### 2. Domain Entities & Schema
- **Operational Pods (4 pods)**: Groupings led by Pod Leads (`pod-alpha`, `pod-beta`, `pod-gamma`, `pod-delta`) serving as the first-line boundary for emergency backup allocation.
- **Employees (32 specialists)**: Configured with role, email, skills (`CS`, `ACC`, `Retention`, `NDR`, `CatalogOps`), contracted weekly offs (2 days/week), preferred rest days, and consecutive work limit (6 days).
- **Client Brands (16 brands)**:
  - **13 Single-Resource Brands (81.25%)**: E.g., *PureGlow Skincare*, *ChaiCraft Blends*, *SparkleTooth Care*. Managed end-to-end by a single dedicated employee.
  - **3 Multi-Resource Brands (18.75%)**: E.g., *NovaKart D2C SuperStore* (3 specialists), *KicksLane Sneaker Vault* (3 specialists), *NutriVibe Active Nutrition* (2 specialists).
- **Operating Calendars**:
  - `365_DAYS`: Active every day including weekends and national holidays.
  - `DAILY_EXCEPT_HOLIDAYS`: Active 7 days a week, closed on public holidays.
  - `MON_SAT_EXCEPT_HOLIDAYS`: Active Monday through Saturday, closed on Sundays and public holidays.
  - `MON_FRI_EXCEPT_HOLIDAYS`: Active Monday through Friday, closed on weekends and public holidays.
- **Process Requirements**: Minimum staffing rules parameterized per brand and process for weekdays, weekends, and holidays.
- **Leaves & Comp-Offs**: Hard constraints tracking approved planned leaves, festival comp-offs, and sick leaves.

---

## 🧠 Section 8: Tell Us How You Think

### 1. How did you model employees, brands, processes, pods, and their relationships?
We designed a relational, decoupled schema where brand operating demand is strictly separated from employee working capacity:
1. **Pods**: Each pod is governed by a `leadId` (Pod Lead) and hosts a cluster of specialized agents. Pods represent the operational unit of resilience—when a brand faces an unexpected absence, backup recommendations prioritize candidates within the same pod to preserve institutional domain knowledge.
2. **Employees**: Modeled with an array of skill tags (`ProcessType[]`), target weekly-off allowances (2 days/week), preferred off-days (e.g. Sunday/Saturday), and max consecutive working days (`maxConsecutiveDays: 6`).
3. **Brands**: Configured with an `operatingCalendar` enum and a `requiredProcesses` array defining minimum headcounts.
4. **Relational Linkage**: A brand maintains `primaryAssigneeIds` pointing to employees. If `isSingleResource: true`, exactly one specialist is assigned; if `false`, multiple specialists are mapped with distinct primary process tags (e.g., Manish on CS, Aditi on ACC, Kunal on NDR).

### 2. How does your system generate a roster and determine whether it satisfies the required constraints?
The scheduling engine executes a deterministic, multi-stage constraint-satisfaction pipeline:
- **Phase 1: Hard Absence Injection**: Approved leaves, comp-offs, and sick leaves are registered first. No shifts are assigned to an employee on these days.
- **Phase 2: Brand Calendar Inactive Days**: If a brand is closed on a date (e.g. a Mon-Fri brand on Sunday or a holiday), the assigned employee is automatically given a weekly off or holiday rest day.
- **Phase 3: Work-Streak & Consecutive Day Enforcement**: The solver tracks active work streaks. If an employee reaches 6 consecutive work days, a rest day is mandatorily scheduled.
- **Phase 4: Multi-Resource Staggering**: For multi-employee brands, off-days are staggered across team members (e.g. Employee A is off Mon-Tue, Employee B is off Wed-Thu) to guarantee continuous brand coverage.
- **Phase 5: Exhaustive Validation Scan**: The `detectConflicts` engine evaluates every brand and required process for every day of the month:
  $$\text{Active Headcount} = \sum \text{Assigned Employees Working} + \sum \text{Pod Backups}$$
  If $\text{Active Headcount} < \text{Min Staffing}$, a **Critical Gap** conflict is emitted.

### 3. How did you handle the difference between single-resource brands and brands with multiple employees?
- **Single-Resource Brands (~81%)**: The single employee is the default single point of failure (SPOF). However, labor rules require that this employee also receive 2 weekly offs per week. For 365-day brands, the generator schedules their weekly offs and intentionally flags a **Single-Resource Gap** alert. This makes the operational trade-off visible to the manager rather than silently ignoring it, and surfaces recommended pod floaters.
- **Multi-Resource Brands (~19%)**: The system coordinates peer availability. Before assigning a weekly off to an employee, it checks whether remaining active peers possess the necessary skill sets to fulfill minimum client requirements.

### 4. What happens when an employee manages all processes for a brand but is unavailable on a required working day?
When a solo specialist is absent (e.g. Ananya Iyer on *PureGlow Skincare* on Nov 14):
1. The system immediately flags a **🔴 CRITICAL SINGLE_RESOURCE_GAP**.
2. The Conflict Drawer generates a plain-language diagnostic: *"PureGlow requires CS and ACC coverage, but sole specialist Ananya Iyer is on approved leave. Staffing is 0/1."*
3. The engine activates the **Pod Backup Recommendation Algorithm**, scoring candidates based on:
   - Pod alignment (same pod receives a +30 familiarity bonus).
   - Skill overlap (+10 per matching process qualification).
   - Availability on that specific date (candidates currently on weekly off or with light loads).
4. The operations manager can resolve the gap with one click using the "Quick Resolve" button or through the interactive Change Simulator.

### 5. How does your system handle conflicting requirements or insufficient staffing?
We enforce a strict constraint priority hierarchy:
$$\text{Mandatory Client Operating Day} > \text{Statutory Approved Leave} > \text{Preferred Weekly Off Day}$$
1. If an employee requests leave on a mandatory coverage day, **Approved Leave takes precedence** (employee rest rights are preserved), and the resulting brand deficit is escalated to management.
2. If total staffing in a pod is insufficient to satisfy all active brands simultaneously:
   - The roster remains in **DRAFT** status, blocking premature publication.
   - The diagnostic engine details the exact deficit and suggests remedial actions (e.g. converting a weekly off to a comp-off, approving an overtime override, or assigning a cross-pod specialist).

### 6. Which parts of the process did you automate, and which did you leave under human control? Why?
- **Automated**:
  - Base monthly roster generation across all 32 employees.
  - Multi-employee off-day staggering.
  - Streak tracking and consecutive day enforcement (<= 6 days).
  - Real-time constraint conflict detection across all brand calendars.
  - Pod backup candidate scoring and ranking.
- **Human-Controlled**:
  - **Final Publication**: The operations manager must review and formally click "Publish" once all critical gaps are addressed.
  - **Emergency Leave Approvals & Manual Shift Overrides**: Operations managers retain full authority to manually edit any cell via the Shift Inspector modal.
  - *Rationale*: Scheduling algorithms cannot anticipate sudden client volume spikes, interpersonal employee preferences, or qualitative nuances. Human oversight ensures accountability and flexibility.

### 7. If the company doubled its team and brand count, what would you change about your solution?
At 60+ employees and 30+ brands:
1. **Background WebWorker / WASM Solver**: Decouple the solver from the React main UI thread, moving optimization to a background WebWorker or Python OR-Tools microservice for sub-second execution.
2. **Dedicated Pod Floater Pools**: Allocate 1–2 "floating specialists" per pod who do not own primary brands, designated solely to cover rotating weekly offs and leaves for single-resource brands.
3. **Self-Service Shift Bidding & Swapping**: Empower employees to propose peer-to-peer shift swaps through a mobile-friendly view, automatically pre-validated by the engine before pod lead approval.

### 8. If you had one additional week to work on this, what would you improve first?
1. **Interactive Drag-and-Drop Shift Swapping**: Direct visual calendar interaction allowing managers to drag a shift from one employee to another with live drop validation.
2. **Multi-Channel Webhook Notifications**: Integration with Slack, Microsoft Teams, and WhatsApp to notify specialists when monthly rosters are published or shift changes occur.
3. **HRMS & Google Calendar Bi-directional Sync**: Direct integration with BambooHR/Keka to automatically import approved leave requests, and an `.ics` feed export for employees to sync shifts with their mobile calendars.

---

## 🖥️ 5 Core Stakeholder Views

1. **Company-Wide Matrix**: Comprehensive monthly table showing all 32 employees across 30 days. Includes search, pod filtering, role filtering, status badges (`W`, `WO`, `L`, `CO`, `H`), and click-to-edit inspector.
2. **Pod-Wise View**: Grouped by the 4 operational pods. Shows Pod Lead details, active staffing counts, and pod coverage health.
3. **Brand Coverage View**: Shows operating calendars (365 Days, Mon-Sat, Mon-Fri), assigned staff, and daily compliance indicators (Green check when staffed, Red alert when uncovered).
4. **Process-Wise View**: Staffing breakdown across the 5 core processes (`CS`, `ACC`, `Retention`, `NDR`, `CatalogOps`) with daily deployed headcount totals.
5. **Employee Schedule Card**: Individual specialist view with monthly summary metrics (Working days, Weekly offs, Leaves, Comp-offs, Total hours) and visual calendar card.

---

## 🔄 Handling Changes (Feature Demonstration)

The application provides a dedicated **Change Simulator Modal** (`Handle Change` button in top navigation):
1. **Scenario 1 — Single-Resource Gap**: Select Ananya Iyer (*PureGlow Skincare*, 365-day brand) on Nov 14. Mark as Emergency Leave. The system flags an immediate 0/1 coverage deficit, explains the risk, and ranks pod backup candidates (e.g. Rohan Mehta or Karthik Rao). Clicking "Apply Resolution" assigns the backup and re-validates the roster.
2. **Scenario 2 — Multi-Resource Absence**: Select Manish Tiwari (*NovaKart SuperStore*, 3-person team) on Nov 18. Mark as Comp-Off. The engine analyzes peer skills and confirms: *"Remaining staff (Aditi Chawla & Kunal Singhal) possess requisite skills to maintain minimum coverage."*

---

## 📊 Sample Dataset Overview

- **Employees**: 32 specialists across 4 pods (Aarav Sharma, Pooja Desai, Rohan Mehta, Sneha Patel as Pod Leads).
- **Brands**: 16 D2C brands:
  - 13 Single-Resource Brands (81.25%)
  - 3 Multi-Resource Brands (18.75%)
- **Public Holidays**: November 2026 (Diwali Eve, Diwali Lakshmi Puja, Govardhan Puja, Bhai Dooj, Guru Tegh Bahadur Martyrdom Day, Guru Nanak Jayanti).
- **Pre-configured Leaves**: Family wedding leave for solo specialist on Nov 14, comp-off on Nov 18, travel leaves Nov 20-21.

---

## 📽️ Demo Video Walkthrough Script (3–5 Minutes)

1. **Minute 0:00 – 0:45 | Introduction & Problem Scope**:
   - Welcome & overview of DataStraw's operational context.
   - Show the 4 Pods, 32 employees, and 16 client brands (highlighting the 81% single-resource vs 19% multi-resource distribution).
2. **Minute 0:45 – 1:30 | Generating the Roster & Conflict Detection**:
   - Click "Generate Roster". Show deterministic solver in action.
   - Open the Conflict Drawer: examine real-time detection of single-resource risks and leave collisions.
3. **Minute 1:30 – 2:30 | Stakeholder Views**:
   - Walk through Company View, Pod View, Brand View (green/red daily coverage), Process View, and Employee Schedule Card.
4. **Minute 2:30 – 3:45 | Demonstrating Change Management (Section 3.F)**:
   - Click "Handle Change".
   - Test Scenario A (Solo employee absence on 365-day brand): show instant gap alert and ranked pod backup recommendations. Click "Apply Resolution" and watch the gap resolve!
   - Test Scenario B (Multi-resource absence): demonstrate how the system evaluates peer skill absorption without requiring an external floater.
5. **Minute 3:45 – 4:30 | Manual Overrides, Export & Publication**:
   - Click any cell to show the Shift Inspector modal and make a manual edit.
   - Export roster to CSV and JSON.
   - Click "Publish" to transition roster from Draft to Published with celebration confetti.

---

## 📧 Submission Details

- **Primary Recipients**: `ozair.shaikh@datastraw.in`, `aryan.jaiswal@datastraw.in`
- **CC**: `talent@datastraw`
- **Subject**: `Smart Roster Management System Assignment - Tanmay Nitturkar`

### Email Body Template:
```text
Dear Ozair, Aryan, and the DataStraw Talent Team,

Please find my completed hiring assignment for the Smart Roster Management System below:

1. Application URL: https://datastraw-smart-roster.vercel.app (or local preview: npm run preview)
2. GitHub Repository: https://github.com/tanmaynitturkar/Datastraw-smart-roster-management
3. LinkedIn Profile: https://www.linkedin.com/in/tanmay-nitturkar
4. Demo Video (Loom): https://www.loom.com/share/your-demo-video-id
5. Comprehensive Submission PDF: Attached with detailed architecture note and answers to all 8 questions.

Approach Note:
The system is built on a deterministic Constraint-Satisfaction engine that decouples client brand operating calendars (365 days vs Mon-Sat vs Mon-Fri) from employee rest schedules. It specifically handles the operational vulnerability of single-resource brands (~81% of client accounts) through real-time conflict detection and intelligent pod backup recommendations, ensuring continuous client coverage without manual rebuilds.

Looking forward to discussing the solution with you!

Best regards,
Tanmay Nitturkar
tanmaynitturkar@gmail.com
```
