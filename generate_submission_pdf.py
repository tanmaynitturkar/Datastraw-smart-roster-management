import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (on pages after cover / page 1)
        if self._pageNumber > 1:
            self.drawString(
                54,
                750,
                "DATASTRAW TECH INTERNSHIP ASSESSMENT — SMART ROSTER MANAGEMENT SYSTEM"
            )
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(
            54,
            36,
            "Confidential Hiring Submission Document | DataStraw Operations Engineering"
        )
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 558, 46)

        self.restoreState()

def create_submission_pdf(filename="DataStraw_Smart_Roster_Management_System_Submission.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e1b4b")   # deep indigo
    accent_color = colors.HexColor("#4338ca")    # indigo-700
    text_dark = colors.HexColor("#0f172a")       # slate-900
    text_muted = colors.HexColor("#475569")      # slate-600
    bg_light = colors.HexColor("#f8fafc")        # slate-50
    border_color = colors.HexColor("#cbd5e1")    # slate-300

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=12,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=text_dark,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        "DocBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=text_dark,
        leftIndent=14,
        spaceAfter=3,
    )

    callout_style = ParagraphStyle(
        "DocCallout",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1e293b"),
    )

    code_style = ParagraphStyle(
        "DocCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    elements = []

    # Title & Header Banner
    elements.append(Paragraph("DATASTRAW TECH INTERNSHIP ASSESSMENT", subtitle_style))
    elements.append(Paragraph("Smart Roster Management System", title_style))
    elements.append(Paragraph("<b>Submission Dossier:</b> System Architecture, Implementation Report & Evaluator Q&A", ParagraphStyle(
        "SubMeta", fontName="Helvetica", fontSize=10, textColor=text_muted, leading=14, spaceAfter=14
    )))

    elements.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=0, spaceAfter=12))

    # Meta Info Table
    meta_data = [
        [
            Paragraph("<b>Candidate Name:</b> Tanmay Nitturkar", body_style),
            Paragraph("<b>Submission Date:</b> November 2026", body_style),
        ],
        [
            Paragraph("<b>Position:</b> Tech Intern (Operations & Engineering)", body_style),
            Paragraph("<b>Tech Stack:</b> React 19, TypeScript, Tailwind CSS, Vite", body_style),
        ],
        [
            Paragraph("<b>Working App URL:</b> <font color='#4338ca'><u>https://datastraw-smart-roster.vercel.app</u></font>", body_style),
            Paragraph("<b>GitHub Repo:</b> <font color='#4338ca'><u>https://github.com/tanmaynitturkar/Datastraw-smart-roster-management</u></font>", body_style),
        ],
        [
            Paragraph("<b>Primary Email:</b> ozair.shaikh@datastraw.in, aryan.jaiswal@datastraw.in", body_style),
            Paragraph("<b>CC:</b> talent@datastraw", body_style),
        ]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_meta)
    elements.append(Spacer(1, 14))

    # 1. Executive Summary & Approach Note
    elements.append(Paragraph("1. Executive Summary & Approach Note", h1_style))
    p_approach = (
        "<b>Approach Note (2–3 Sentences as requested):</b><br/>"
        "The application models operational scheduling as a deterministic <b>Constraint-Satisfaction problem</b> "
        "that formally separates client brand operating requirements (365-day, Mon-Sat, Mon-Fri, and Public Holiday rules) "
        "from individual employee rest schedules (statutory weekly offs, consecutive day limits, planned leaves, and comp-offs). "
        "It specifically resolves the critical vulnerability of <b>single-resource brands (~81% of client accounts)</b> "
        "by combining real-time conflict detection with intelligent, pod-level backup recommendations, enabling "
        "seamless schedule adaptation without requiring manual roster rebuilds."
    )
    elements.append(Paragraph(p_approach, body_style))
    elements.append(Spacer(1, 8))

    # 2. System Architecture & Core Problem Formulation
    elements.append(Paragraph("2. System Architecture & Problem Formulation", h1_style))
    elements.append(Paragraph(
        "In a fast-growing customer experience company managing D2C brands, simple spreadsheet scheduling quickly breaks down. "
        "The operational landscape presents several core tensions:",
        body_style
    ))
    elements.append(Paragraph("• <b>Single Resource Vulnerability:</b> ~80% of client brands rely on a single dedicated employee handling all processes (Customer Support, Abandoned Cart Conversions, NDR). A single weekly off or sick day leaves the client 100% unstaffed.", bullet_style))
    elements.append(Paragraph("• <b>Asymmetric Operating Rules:</b> Some brands operate 365 days a year including national holidays; others operate Mon–Sat; while corporate accounts operate Mon–Fri only.", bullet_style))
    elements.append(Paragraph("• <b>Multi-Resource Staggering:</b> Brands with 2 to 3 employees require staggered weekly offs so that client coverage never drops below contractual minimums.", bullet_style))
    elements.append(Paragraph("• <b>Statutory Compliance:</b> Employees are entitled to 2 weekly offs per week and cannot work more than 6 consecutive days without a mandatory rest day.", bullet_style))

    # Architecture Overview Table
    arch_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology / Implementation</b>", body_style), Paragraph("<b>Operational Function</b>", body_style)],
        [Paragraph("<b>Frontend Framework</b>", body_style), Paragraph("React 19 + TypeScript + Vite", body_style), Paragraph("Ultra-fast client-side reactive interface with zero lag", body_style)],
        [Paragraph("<b>Styling & Icons</b>", body_style), Paragraph("Tailwind CSS + Lucide Icons", body_style), Paragraph("Clean enterprise dashboard, color-coded shift badges & status cards", body_style)],
        [Paragraph("<b>Scheduling Engine</b>", body_style), Paragraph("Deterministic CSP Solver", body_style), Paragraph("Multi-phase solver honoring hard constraints & soft preferences", body_style)],
        [Paragraph("<b>Conflict Detector</b>", body_style), Paragraph("Real-Time Heuristic Scanner", body_style), Paragraph("Instant identification of critical gaps, single-resource risks & collisions", body_style)],
        [Paragraph("<b>Change Simulator</b>", body_style), Paragraph("Pod Resilience Engine", body_style), Paragraph("Evaluates peer absorption vs. ranked pod backup recommendations", body_style)],
        [Paragraph("<b>Storage & Export</b>", body_style), Paragraph("LocalStorage + CSV/JSON Exporters", body_style), Paragraph("Persistence across sessions, reset capability & spreadsheet export", body_style)],
    ]
    t_arch = Table(arch_data, colWidths=[120, 160, 224])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0e7ff")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_arch)
    elements.append(Spacer(1, 10))

    # 3. Data Modeling & Domain Schema
    elements.append(Paragraph("3. Data Modeling & Domain Schema", h1_style))
    elements.append(Paragraph(
        "The system models five core relational entities designed for scale and maintainability:",
        body_style
    ))
    elements.append(Paragraph("1. <b>Operational Pods (4 Pods):</b> Units led by a Pod Lead (Aarav Sharma, Pooja Desai, Rohan Mehta, Sneha Patel) providing localized operational governance and peer backup capacity.", bullet_style))
    elements.append(Paragraph("2. <b>Employees (32 Specialists):</b> Configured with skill sets (<code>CS</code>, <code>ACC</code>, <code>Retention</code>, <code>NDR</code>, <code>CatalogOps</code>), contracted weekly offs (2 days/week), preferred rest days, and consecutive work limits (6 days).", bullet_style))
    elements.append(Paragraph("3. <b>Client Brands (16 Brands):</b> Divided into 13 Single-Resource Brands (81.25%) and 3 Multi-Resource Brands (18.75%). Configured with operating calendars (<code>365_DAYS</code>, <code>DAILY_EXCEPT_HOLIDAYS</code>, <code>MON_SAT_EXCEPT_HOLIDAYS</code>, <code>MON_FRI_EXCEPT_HOLIDAYS</code>).", bullet_style))
    elements.append(Paragraph("4. <b>Process Requirements:</b> Defines required headcounts for weekdays, weekends, and holidays per brand.", bullet_style))
    elements.append(Paragraph("5. <b>Leaves & Holidays:</b> Tracks approved planned leaves, festival comp-offs, sick leaves, and gazetted national holidays for November 2026.", bullet_style))
    elements.append(Spacer(1, 10))

    # 4. Detailed Answers to Section 8: Tell Us How You Think
    elements.append(Paragraph("4. Detailed Answers to 'Tell Us How You Think' (Section 8)", h1_style))

    q_answers = [
        (
            "Q1: How did you model employees, brands, processes, pods, and their relationships?",
            "We modeled the operational domain using a normalized, decoupled architecture. "
            "A <b>Pod</b> acts as the organizational boundary containing a designated Pod Lead and a pool of specialists. "
            "An <b>Employee</b> encapsulates role, verified skills (CS, ACC, NDR, Retention, CatalogOps), contractual weekly-off targets (2 days/week), preferred rest days, and streak counters. "
            "A <b>Brand</b> defines client obligations via its operating calendar and required process headcounts. "
            "Crucially, the relationship between brands and employees is decoupled: ~81% of brands are linked to a single dedicated specialist, "
            "while ~19% are mapped to multi-specialist teams with differentiated process duties. Pod Leads and floating specialists hold pod-wide scope, "
            "enabling dynamic backup deployment without altering core contracts."
        ),
        (
            "Q2: How does your system generate a roster and determine whether it satisfies the required constraints?",
            "Roster generation follows a multi-pass <b>Constraint-Satisfaction Pipeline</b>:<br/>"
            "• <i>Pass 1 (Hard Leave Injections):</i> Approved planned leaves, comp-offs, and sick days are locked as non-working.<br/>"
            "• <i>Pass 2 (Brand Inactivity):</i> Days when client brands are closed (e.g., weekends/holidays for Mon-Fri brands) are assigned as weekly offs or holidays.<br/>"
            "• <i>Pass 3 (Work-Streak Limit):</i> If an employee reaches 6 consecutive work days, a rest day is mandatorily scheduled.<br/>"
            "• <i>Pass 4 (Multi-Resource Staggering):</i> Off-days are interleaved across team members to prevent zero-coverage days.<br/>"
            "• <i>Validation Pass:</i> The engine scans every calendar day, computing active headcount against client minimums: "
            "if active headcount < required, a Critical Gap or Single-Resource Gap is flagged with a diagnostic explanation."
        ),
        (
            "Q3: How did you handle the difference between single-resource brands and brands with multiple employees?",
            "<b>Single-Resource Brands (~81%):</b> The sole specialist represents a Single Point of Failure (SPOF). However, labor compliance requires that they receive 2 weekly offs per week. For 365-day brands, scheduling their weekly off creates a known coverage dilemma. Instead of hiding this, our engine explicitly flags a <i>Single-Resource Gap</i> alert and suggests available pod floaters.<br/>"
            "<b>Multi-Resource Brands (~19%):</b> The solver staggers weekly offs across the team (e.g. Emp 1 off Mon-Tue, Emp 2 off Wed-Thu, Emp 3 off Sat-Sun). When one employee takes leave, the system first evaluates <i>Internal Peer Absorption</i> (whether the remaining active employees possess the required skills) before alerting for external floaters."
        ),
        (
            "Q4: What happens when an employee manages all processes for a brand but is unavailable on a required working day?",
            "The system immediately raises a <b>🔴 CRITICAL SINGLE_RESOURCE_GAP</b> conflict. Rather than silently generating an invalid schedule, the engine:<br/>"
            "1. Disables roster publication by setting status to <code>DRAFT</code>.<br/>"
            "2. Triggers the <b>Pod Backup Scoring Algorithm</b>, evaluating candidate floaters from the same pod based on skill overlap, pod familiarity, and current workload.<br/>"
            "3. Renders a plain-language explanation in the Conflict Drawer detailing which client brand is exposed.<br/>"
            "4. Provides a one-click 'Quick Resolve' action to assign the top-ranked pod backup."
        ),
        (
            "Q5: How does your system handle conflicting requirements or insufficient staffing?",
            "We enforce a strict priority hierarchy: <b>Mandatory Client Operating Day > Statutory Employee Leave > Preferred Weekly Off Day</b>.<br/>"
            "If an employee requests leave on a mandatory coverage day, approved leave is honored to protect employee well-being, and the resulting coverage deficit is surfaced to management. "
            "If total pod headcount cannot cover all operating brands on a given date, the roster is locked in DRAFT status, and the Conflict Drawer explains the exact shortfall and proposes compensatory options (e.g. converting a weekly off into a paid comp-off or drafting a cross-pod specialist)."
        ),
        (
            "Q6: Which parts of the process did you automate, and which did you leave under human control? Why?",
            "<b>Automated:</b> Base monthly schedule generation across 32 employees, streak tracking (max 6 days), multi-resource off-day staggering, holiday deductions, conflict detection, and backup candidate scoring. These operations are computationally heavy and error-prone when attempted manually in spreadsheets.<br/>"
            "<b>Human-Controlled:</b> Final publication authorization, emergency leave approvals, and manual shift overrides via the Shift Inspector modal.<br/>"
            "<i>Rationale:</i> An algorithm cannot anticipate sudden client volume surges, qualitative client relationship nuances, or personal emergency negotiations. Human oversight ensures contextual accountability."
        ),
        (
            "Q7: If the company doubled its team and brand count, what would you change about your solution?",
            "At 60+ employees and 30+ brands, we would implement:<br/>"
            "1. <b>Asynchronous WebWorker / WASM Solver:</b> Offload constraint satisfaction from the React main thread to a dedicated WebWorker or Python OR-Tools microservice to maintain sub-second response times.<br/>"
            "2. <b>Dedicated Pod Floater Pools:</b> Allocate 1–2 unassigned floaters per pod specifically dedicated to buffering single-resource brand rotations.<br/>"
            "3. <b>Self-Service Shift Bidding & Swapping:</b> Introduce a peer-to-peer shift swap portal where employees can request swaps that are pre-validated by the solver before pod lead sign-off."
        ),
        (
            "Q8: If you had one additional week to work on this, what would you improve first?",
            "We would prioritize three enhancements:<br/>"
            "1. <b>Interactive Drag-and-Drop Shift Swapper:</b> Direct calendar drag-and-drop with real-time shadow validation showing green/red drop legality.<br/>"
            "2. <b>Multi-Channel Webhook Notifications:</b> Integration with Slack, Microsoft Teams, and WhatsApp to notify specialists when monthly rosters are published or shift changes occur.<br/>"
            "3. <b>HRMS & Calendar Bi-directional Sync:</b> Direct integration with BambooHR/Keka to automatically import approved leave requests, and an <code>.ics</code> feed export for employees to sync shifts with their mobile calendars."
        )
    ]

    for q_title, q_body in q_answers:
        q_elements = []
        q_elements.append(Paragraph(f"<b>{q_title}</b>", h2_style))
        q_elements.append(Paragraph(q_body, body_style))
        q_elements.append(Spacer(1, 4))
        elements.append(KeepTogether(q_elements))

    elements.append(Spacer(1, 10))

    # 5. Stakeholder Views Overview
    elements.append(Paragraph("5. Stakeholder Views & Operational Capabilities", h1_style))
    elements.append(Paragraph("The application provides five purpose-built views tailored to different operational needs:", body_style))

    views_data = [
        [Paragraph("<b>View Name</b>", body_style), Paragraph("<b>Target User</b>", body_style), Paragraph("<b>Key Capabilities</b>", body_style)],
        [Paragraph("<b>1. Company-Wide Matrix</b>", body_style), Paragraph("Operations Manager / Director", body_style), Paragraph("Complete monthly grid of 32 employees x 30 days. Search by name/skill, filter by pod/role, color-coded shift badges (W, WO, L, CO, H), cell click-to-edit inspector.", body_style)],
        [Paragraph("<b>2. Pod-Wise View</b>", body_style), Paragraph("Pod Leads (Aarav, Pooja, Rohan, Sneha)", body_style), Paragraph("Grouped by operational pod. Displays pod health score, member schedules, and active pod staffing totals.", body_style)],
        [Paragraph("<b>3. Brand Coverage View</b>", body_style), Paragraph("Account Managers / Client Ops", body_style), Paragraph("Tracks 365-day vs Mon-Sat vs Mon-Fri operating calendars, assigned specialists, and daily coverage compliance (Green check = staffed, Red alert = gap).", body_style)],
        [Paragraph("<b>4. Process-Wise View</b>", body_style), Paragraph("Functional Process Leads", body_style), Paragraph("Breakdown across CS, ACC, Retention, NDR, and CatalogOps. Displays daily active deployed headcounts against volume requirements.", body_style)],
        [Paragraph("<b>5. Employee Schedule Card</b>", body_style), Paragraph("Individual Specialists", body_style), Paragraph("Personal calendar card with monthly summary metrics (Working days, Weekly offs, Leaves, Comp-offs, Total hours) and shift assignment details.", body_style)],
    ]
    t_views = Table(views_data, colWidths=[130, 130, 244])
    t_views.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0e7ff")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_views)
    elements.append(Spacer(1, 10))

    # 6. Change Simulator Demonstration
    elements.append(Paragraph("6. Handling Changes: Dynamic Simulation Engine (Section 3.F)", h1_style))
    elements.append(Paragraph(
        "To satisfy the core requirement of demonstrating how the system handles changes after roster generation, "
        "we engineered an interactive <b>Change Simulator</b> modal (accessible via 'Handle Change' in the top navigation):",
        body_style
    ))
    elements.append(Paragraph("• <b>Scenario A (Single-Resource Gap):</b> The user selects Ananya Iyer (sole specialist for PureGlow Skincare, 365-day brand) on Nov 14. Marking her on emergency leave immediately triggers a critical gap alert. The engine analyzes pod peers and ranks candidate backups (e.g. Rohan Mehta or Karthik Rao) by skill match and workload. Clicking 'Apply Resolution' instantly assigns the backup and re-validates the roster.", bullet_style))
    elements.append(Paragraph("• <b>Scenario B (Multi-Resource Peer Absorption):</b> The user selects Manish Tiwari (1 of 3 specialists on NovaKart) on Nov 18. Marking him on comp-off triggers skill evaluation. The system confirms: <i>'Internal Absorption: Active peers (Aditi Chawla & Kunal Singhal) possess requisite skills to maintain minimum coverage without an external floater.'</i>", bullet_style))
    elements.append(Spacer(1, 10))

    # 7. Demo Video Walkthrough Script
    elements.append(Paragraph("7. Demo Video Walkthrough Script (3–5 Minutes)", h1_style))
    elements.append(Paragraph(
        "A structured guide for recording the requested 3–5 minute Loom / walkthrough video:",
        body_style
    ))

    script_data = [
        [Paragraph("<b>Time Marker</b>", body_style), Paragraph("<b>Walkthrough Section</b>", body_style), Paragraph("<b>Screen Action & Narration</b>", body_style)],
        [Paragraph("0:00 – 0:45", body_style), Paragraph("Introduction & Context", body_style), Paragraph("Introduce DataStraw's operational context. Highlight 32 employees, 4 pods, and the 81% single-resource vs 19% multi-resource distribution.", body_style)],
        [Paragraph("0:45 – 1:30", body_style), Paragraph("Generation & Conflicts", body_style), Paragraph("Click 'Generate Roster'. Show solver speed. Open Conflict Drawer to demonstrate real-time detection of single-resource risks and leave collisions.", body_style)],
        [Paragraph("1:30 – 2:30", body_style), Paragraph("5 Stakeholder Views", body_style), Paragraph("Switch between Company View, Pod View, Brand Coverage View (green checks vs red gaps), Process View, and Employee Schedule Card.", body_style)],
        [Paragraph("2:30 – 3:45", body_style), Paragraph("Handling Changes (3.F)", body_style), Paragraph("Open 'Handle Change'. Trigger Scenario 1 (PureGlow solo gap) -> show ranked pod backups -> apply resolution. Trigger Scenario 2 (NovaKart multi-resource) -> show internal peer absorption.", body_style)],
        [Paragraph("3:45 – 4:30", body_style), Paragraph("Manual Edit & Publish", body_style), Paragraph("Click any cell to show Shift Inspector. Export roster to CSV/JSON. Click 'Publish' to transition from Draft to Published with celebration confetti.", body_style)],
    ]
    t_script = Table(script_data, colWidths=[80, 130, 294])
    t_script.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0e7ff")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_script)
    elements.append(Spacer(1, 10))

    # 8. Official Submission Details & Email Template
    elements.append(Paragraph("8. Official Submission Checklist & Email Template", h1_style))
    elements.append(Paragraph(
        "As instructed in Section 9 of the hiring assignment PDF, submit the assignment with the following details:",
        body_style
    ))

    email_text = (
        "<b>To:</b> ozair.shaikh@datastraw.in, aryan.jaiswal@datastraw.in<br/>"
        "<b>CC:</b> talent@datastraw<br/>"
        "<b>Subject:</b> Smart Roster Management System Assignment - Tanmay Nitturkar<br/><br/>"
        "<b>Email Body:</b><br/>"
        "Dear Ozair, Aryan, and the DataStraw Talent Team,<br/><br/>"
        "Please find my completed submission for the Smart Roster Management System assignment below:<br/><br/>"
        "1. <b>Application URL:</b> https://datastraw-smart-roster.vercel.app (or local preview: npm run preview)<br/>"
        "2. <b>GitHub Repository:</b> https://github.com/tanmaynitturkar/Datastraw-smart-roster-management<br/>"
        "3. <b>LinkedIn Profile:</b> https://www.linkedin.com/in/tanmay-nitturkar (ensured accessible)<br/>"
        "4. <b>Demo Video (3–5 min):</b> https://www.loom.com/share/your-demo-video-id<br/>"
        "5. <b>Approach Note:</b> The system models operational scheduling as a deterministic Constraint-Satisfaction "
        "problem that formally separates client brand operating requirements from employee rest schedules. "
        "It specifically resolves single-resource brand vulnerabilities (~81% of client accounts) through real-time conflict "
        "detection and intelligent pod backup recommendations, ensuring continuous client coverage without manual rebuilds.<br/><br/>"
        "Attached is the full Submission Dossier PDF containing system architecture notes and comprehensive answers to all 8 evaluation questions.<br/><br/>"
        "Looking forward to hearing from you!<br/><br/>"
        "Best regards,<br/>"
        "<b>Tanmay Nitturkar</b><br/>"
        "tanmaynitturkar@gmail.com"
    )
    t_email = Table([[Paragraph(email_text, body_style)]], colWidths=[504])
    t_email.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, accent_color),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_email)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    create_submission_pdf("submission.pdf")
    create_submission_pdf("DataStraw_Smart_Roster_Management_System_Submission.pdf")
