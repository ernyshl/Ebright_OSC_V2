// TODO: create workflow_template + workflow_step + workflow_link tables in
// Prisma schema and replace this module with real DB queries. Until then,
// these mocks let the Workflow Center UI render with representative data.

export type WorkflowStatus = "draft" | "active" | "archived";
export type StepActor = "Candidate" | "HOD" | "HR" | "Buddy" | "System";
export type StepType = "Task" | "Submission" | "Meeting" | "Sign-off" | "Reading";
export type WorkflowTrigger =
  | "after-day-3"
  | "after-branch"
  | "manual";

export interface WorkflowStepMock {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  actor: StepActor;
  type: StepType;
  dueDaysAfterStart: number;
  required: boolean;
}

export interface WorkflowMock {
  id: number;
  name: string;
  department: string;
  appliesTo: string[]; // employee type labels
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  assignedCount: number;
  steps: WorkflowStepMock[];
  linkedAfterIds: number[]; // workflows triggered after this one
}

export const DEPARTMENTS = [
  "Optimisation (IT)",
  "IOP",
  "Academy",
  "Finance",
  "Human Resources",
  "Marketing",
  "CEO",
] as const;

export const EMPLOYEE_TYPES = [
  "Regular Intern",
  "Protege Intern",
  "Coach (Part-timer)",
  "Coach (Full-timer)",
  "Full-timer (HQ)",
] as const;

export const TRIGGER_OPTIONS: Array<{ value: WorkflowTrigger; label: string }> = [
  { value: "after-day-3", label: "After Day 3 Induction Completed" },
  { value: "after-branch", label: "After Branch Onboarding Completed" },
  { value: "manual", label: "Manual assignment by HR" },
];

// Per-department badge colors (Tailwind-compatible hex)
export function departmentColor(department: string): { bg: string; text: string } {
  switch (department) {
    case "Optimisation (IT)": return { bg: "#EFF6FF", text: "#1D4ED8" };
    case "IOP":               return { bg: "#F5F3FF", text: "#6D28D9" };
    case "Academy":           return { bg: "#F0FDFA", text: "#0F766E" };
    case "Finance":           return { bg: "#FFFBEB", text: "#92400E" };
    case "Human Resources":   return { bg: "#FEF2F2", text: "#991B1B" };
    case "Marketing":         return { bg: "#FDF4FF", text: "#86198F" };
    case "CEO":               return { bg: "#F0FDF4", text: "#15803D" };
    default:                  return { bg: "#F5F5F0", text: "#555" };
  }
}

// Sample data — 8 workflows across departments at various stages
export const MOCK_WORKFLOWS: WorkflowMock[] = [
  {
    id: 1,
    name: "Academy Induction — Tutor Track",
    department: "Academy",
    appliesTo: ["Full-timer (HQ)", "Regular Intern"],
    status: "active",
    trigger: "after-day-3",
    assignedCount: 4,
    steps: [
      { id: 101, stepNumber: 1, title: "Meet department head", description: "30-minute intro with the Academy HOD to align on goals.", actor: "HOD", type: "Meeting", dueDaysAfterStart: 1, required: true },
      { id: 102, stepNumber: 2, title: "Read curriculum guide", description: "Cover the v3 curriculum guide end-to-end.", actor: "Candidate", type: "Reading", dueDaysAfterStart: 2, required: true },
      { id: 103, stepNumber: 3, title: "Shadow a tutor session", description: "Observe a full 90-minute tutor session.", actor: "Candidate", type: "Task", dueDaysAfterStart: 3, required: true },
      { id: 104, stepNumber: 4, title: "Submit reflection note", description: "Brief reflection on shadowed session — what worked, what didn't.", actor: "Candidate", type: "Submission", dueDaysAfterStart: 4, required: true },
      { id: 105, stepNumber: 5, title: "HOD sign-off", description: "Tutor track readiness confirmed by HOD.", actor: "HOD", type: "Sign-off", dueDaysAfterStart: 7, required: true },
    ],
    linkedAfterIds: [2],
  },
  {
    id: 2,
    name: "Academy Systems & LMS Access",
    department: "Academy",
    appliesTo: ["Full-timer (HQ)", "Regular Intern"],
    status: "active",
    trigger: "manual",
    assignedCount: 2,
    steps: [
      { id: 201, stepNumber: 1, title: "Receive LMS credentials", description: "IT provisions the LMS account.", actor: "System", type: "Task", dueDaysAfterStart: 0, required: true },
      { id: 202, stepNumber: 2, title: "Complete LMS walkthrough", description: "Self-paced LMS introduction module.", actor: "Candidate", type: "Reading", dueDaysAfterStart: 1, required: true },
      { id: 203, stepNumber: 3, title: "Publish first practice unit", description: "Create + publish a practice unit in the LMS as a dry run.", actor: "Candidate", type: "Submission", dueDaysAfterStart: 3, required: false },
    ],
    linkedAfterIds: [3],
  },
  {
    id: 3,
    name: "Academy Probation Sign-off",
    department: "Academy",
    appliesTo: ["Full-timer (HQ)"],
    status: "draft",
    trigger: "manual",
    assignedCount: 0,
    steps: [
      { id: 301, stepNumber: 1, title: "Probation review meeting", description: "HOD + buddy + candidate review 90-day probation outcomes.", actor: "HOD", type: "Meeting", dueDaysAfterStart: 0, required: true },
      { id: 302, stepNumber: 2, title: "Final sign-off", description: "HOD confirms probation passed.", actor: "HOD", type: "Sign-off", dueDaysAfterStart: 0, required: true },
    ],
    linkedAfterIds: [],
  },
  {
    id: 4,
    name: "Finance Onboarding — Executive",
    department: "Finance",
    appliesTo: ["Full-timer (HQ)"],
    status: "active",
    trigger: "after-day-3",
    assignedCount: 1,
    steps: [
      { id: 401, stepNumber: 1, title: "AutoCount training", description: "Complete the AutoCount payroll fundamentals course.", actor: "Candidate", type: "Reading", dueDaysAfterStart: 2, required: true },
      { id: 402, stepNumber: 2, title: "Bank access setup", description: "Setup access to the company bank portal.", actor: "HR", type: "Task", dueDaysAfterStart: 3, required: true },
      { id: 403, stepNumber: 3, title: "Practice run — month-end close", description: "Shadow the next month-end close cycle.", actor: "Candidate", type: "Task", dueDaysAfterStart: 14, required: true },
    ],
    linkedAfterIds: [],
  },
  {
    id: 5,
    name: "HR Onboarding — Coordinator",
    department: "Human Resources",
    appliesTo: ["Full-timer (HQ)", "Regular Intern"],
    status: "active",
    trigger: "after-day-3",
    assignedCount: 3,
    steps: [
      { id: 501, stepNumber: 1, title: "HR systems walkthrough", description: "End-to-end tour of the HR portal modules.", actor: "HR", type: "Meeting", dueDaysAfterStart: 1, required: true },
      { id: 502, stepNumber: 2, title: "Read HR policy handbook", description: "Latest HR policy handbook.", actor: "Candidate", type: "Reading", dueDaysAfterStart: 3, required: true },
      { id: 503, stepNumber: 3, title: "Handle 1 mock leave request", description: "Process a mock leave request end-to-end.", actor: "Candidate", type: "Submission", dueDaysAfterStart: 5, required: true },
    ],
    linkedAfterIds: [],
  },
  {
    id: 6,
    name: "Marketing — Content Onboarding",
    department: "Marketing",
    appliesTo: ["Full-timer (HQ)", "Regular Intern"],
    status: "draft",
    trigger: "after-day-3",
    assignedCount: 0,
    steps: [
      { id: 601, stepNumber: 1, title: "Brand book read", description: "Brand guidelines + voice + tone document.", actor: "Candidate", type: "Reading", dueDaysAfterStart: 1, required: true },
      { id: 602, stepNumber: 2, title: "First content brief", description: "Submit a first content brief on assigned topic.", actor: "Candidate", type: "Submission", dueDaysAfterStart: 5, required: true },
    ],
    linkedAfterIds: [],
  },
  {
    id: 7,
    name: "Optimisation — Dev Environment Setup",
    department: "Optimisation (IT)",
    appliesTo: ["Full-timer (HQ)"],
    status: "active",
    trigger: "after-day-3",
    assignedCount: 1,
    steps: [
      { id: 701, stepNumber: 1, title: "Install dev tools", description: "Install Node, Postgres, IDE, VPN client.", actor: "Candidate", type: "Task", dueDaysAfterStart: 1, required: true },
      { id: 702, stepNumber: 2, title: "Repo access + clone", description: "GitHub access provisioned, clone the main repos.", actor: "System", type: "Task", dueDaysAfterStart: 1, required: true },
      { id: 703, stepNumber: 3, title: "Pair on first PR", description: "Pair with buddy on a small first PR.", actor: "Buddy", type: "Task", dueDaysAfterStart: 5, required: true },
    ],
    linkedAfterIds: [],
  },
  {
    id: 8,
    name: "CEO — Executive Onboarding",
    department: "CEO",
    appliesTo: ["Full-timer (HQ)"],
    status: "archived",
    trigger: "manual",
    assignedCount: 0,
    steps: [
      { id: 801, stepNumber: 1, title: "Vision + culture briefing", description: "1:1 with CEO on strategy and culture.", actor: "HOD", type: "Meeting", dueDaysAfterStart: 0, required: true },
    ],
    linkedAfterIds: [],
  },
];

// Status pill colors
export function statusPillClasses(status: WorkflowStatus): string {
  if (status === "active")   return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "draft")    return "bg-slate-100 text-slate-700 border-slate-300";
  return "bg-rose-50 text-rose-700 border-rose-200"; // archived
}

export function findWorkflow(id: number): WorkflowMock | undefined {
  return MOCK_WORKFLOWS.find((w) => w.id === id);
}
