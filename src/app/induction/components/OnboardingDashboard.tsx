"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Home,
  RefreshCw,
  UserMinus,
  UserPlus,
} from "lucide-react";
import {
  createInductionRequest,
  createInductionRequestForEbrightCandidate,
} from "@/app/induction/actions";
import type {
  CombinedExitRow,
  CombinedHireRow,
  DepartmentOption,
  InductionStepView,
  InductionView,
  SubstepTemplateView,
} from "@/app/induction/queries";

// Inline copy of groupSubstepsByParent — queries.ts is server-only so its
// runtime helpers can't be imported into this client component.
// Filters by templateKey AND departmentId (null = global rows visible to all).
function groupSubstepsByParent(
  rows: SubstepTemplateView[],
  templateKey: string,
  departmentId: number | null,
): Record<number, SubstepTemplateView[]> {
  const out: Record<number, SubstepTemplateView[]> = {};
  for (const r of rows) {
    if (r.templateKey !== templateKey) continue;
    // Show rows that match the selected department OR rows with no department
    // (legacy globals). When no department is selected, only show globals.
    if (r.departmentId !== null && r.departmentId !== departmentId) continue;
    if (!out[r.parentStepNumber]) out[r.parentStepNumber] = [];
    out[r.parentStepNumber].push(r);
  }
  return out;
}
import {
  OFFBOARDING_WORKFLOW,
  WORKFLOW_TEMPLATES,
  workflowTemplateLabel,
  type WorkflowStepTemplate,
} from "@/app/induction/templates";

// Onboarding workflow paths (mirrors the 4 employee-type templates in
// templates.ts). Drives the tab switcher on the manager preview so HR can
// flip between the 4 reference workflows without leaving the page.
const EMPLOYEE_TYPE_TEMPLATES: ReadonlyArray<{
  key: string;
  short: string;
  location: string;
  accent: string; // tailwind gradient
}> = [
  { key: "Standard",            short: "Regular Intern",      location: "HQ",                       accent: "from-sky-500 to-blue-600" },
  { key: "ProtegeInternBranch", short: "Protege Intern",      location: "Assigned Branch",          accent: "from-violet-500 to-indigo-600" },
  { key: "CoachPartTimer",      short: "Coach (Part-timer)",  location: "Branch + 3-week training", accent: "from-amber-500 to-orange-600" },
  { key: "FullTimer",           short: "Full-timer",          location: "HQ or Branch",             accent: "from-emerald-500 to-teal-600" },
];
import { WorkflowDiagram } from "./WorkflowDiagram";
import { TrainingChecklist } from "./TrainingChecklist";
import OnboardingWorkflow from "./OnboardingWorkflow";

// Synthetic "today" used as the start date when a manager previews the
// onboarding workflow without an active induction of their own. Lets the
// swimlane component bucket steps by `dueDate - startDate` consistently.
const PREVIEW_START_DATE = (() => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
})();

function previewDueDate(daysFromStart: number): string {
  const d = new Date(PREVIEW_START_DATE);
  d.setUTCDate(d.getUTCDate() + daysFromStart);
  return d.toISOString();
}

interface OnboardingDashboardProps {
  hires: CombinedHireRow[];
  exits: CombinedExitRow[];
  view?: "onboarding" | "offboarding" | "both";
  ownInduction: InductionView | null;
  isManager: boolean;
  substepTemplates: SubstepTemplateView[];
  departments: DepartmentOption[];
}

function templateToPreviewSteps(
  template: readonly WorkflowStepTemplate[],
): InductionStepView[] {
  return template.map((t) => ({
    id: -t.stepNumber,
    stepNumber: t.stepNumber,
    title: t.title,
    description: t.description,
    responsibleName: null,
    responsibleEmail: null,
    // Synthetic dueDate so timeline-based UIs (e.g. OnboardingWorkflow
    // swimlanes) can still bucket preview-only steps.
    dueDate: previewDueDate(t.daysFromStart),
    status: "Pending",
    completedAt: null,
    evidenceFileId: null,
    evidenceUploadedAt: null,
  }));
}

function dayLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "in 1d";
  return `in ${days}d`;
}

export default function OnboardingDashboard({
  hires,
  exits,
  view = "both",
  ownInduction,
  isManager,
  substepTemplates,
  departments,
}: OnboardingDashboardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [refreshing, setRefreshing] = useState(false);

  const showOnboarding = view !== "offboarding";
  const showOffboarding = view !== "onboarding";

  const hiresUrgent = hires.filter((h) => h.isWithin7Days).length;
  const exitsUrgent = exits.filter((e) => e.isWithin7Days).length;

  const heading =
    view === "onboarding"
      ? "Onboarding"
      : view === "offboarding"
        ? "Offboarding"
        : "Onboarding & Offboarding";

  const subheading =
    view === "onboarding"
      ? "Employees within ±1 week of their start date. Add them to the induction queue."
      : view === "offboarding"
        ? "Employees leaving within the next 2 weeks. Add them to the offboarding queue."
        : "Employees within ±1 week of joining, or leaving in the next 2 weeks.";

  const handleAddToQueue = (row: CombinedHireRow | CombinedExitRow) => {
    const key = row.key;
    setPending((p) => new Set(p).add(key));
    setErrors((e) => {
      const next = new Map(e);
      next.delete(key);
      return next;
    });
    startTransition(async () => {
      let result;
      if (row.source === "local" && row.userId !== null) {
        result = await createInductionRequest(row.userId);
      } else {
        // ebrightleads candidate — extract the source_id from `ebr-<id>`.
        const sourceId = parseInt(key.replace(/^ebr-/, ""), 10);
        result = await createInductionRequestForEbrightCandidate(sourceId);
      }
      setPending((p) => {
        const next = new Set(p);
        next.delete(key);
        return next;
      });
      if (!result.ok) {
        setErrors((e) => new Map(e).set(key, result.error ?? "Failed"));
      } else {
        // Successful queue — refresh server data so the row shows as Queued.
        router.refresh();
      }
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setRefreshing(false), 600);
    });
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900">HRMS</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Onboarding Dashboard</span>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{heading}</h1>
            <p className="mt-2 text-sm text-slate-600">{subheading}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            <Link
              href="/induction/control-centre"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Control Centre →
            </Link>
          </div>
        </header>

        <div className={`grid grid-cols-1 ${view === "both" ? "lg:grid-cols-2" : ""} gap-6 mb-8`}>
          {showOnboarding && (
          /* Onboarding card */
          <article className="bg-white border border-slate-200 rounded-2xl p-6">
            <header className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <UserPlus className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Onboarding</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ±1 week of start date
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
                  {hires.length}
                </div>
                <div className="mt-1 text-xs">
                  <span className="font-semibold text-emerald-700">{hiresUrgent}</span>
                  <span className="text-slate-500"> within 1 week</span>
                </div>
              </div>
            </header>

            {hires.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 italic">
                No upcoming hires.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {hires.map((row) => {
                  const isEbright = row.source === "ebrightleads";
                  const isPending = pending.has(row.key);
                  const isQueued = row.hasPendingRequest;
                  const hasInduction = row.inductionProfileStatus !== null;
                  const errorMsg = errors.get(row.key);
                  const rowBg = row.isWithin7Days
                    ? "bg-rose-50 border-rose-200"
                    : "bg-slate-50 border-slate-200";
                  return (
                    <li
                      key={row.key}
                      className={`rounded-xl border ${rowBg} p-3 flex flex-wrap items-center gap-3`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm text-slate-900 truncate">{row.fullName}</p>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              row.isWithin7Days
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {dayLabel(row.daysUntilStart)}
                          </span>
                          {isEbright && (
                            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              ebrightleads
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {row.email ?? row.departmentName ?? "—"} · {row.position ?? "—"} · {row.departmentName ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Starts {row.startDate}</p>
                        {errorMsg && (
                          <p className="text-xs text-red-700 mt-1 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                            {errorMsg}
                          </p>
                        )}
                      </div>
                      {hasInduction ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          {row.inductionProfileStatus === "Completed"
                            ? "Induction Completed"
                            : "In Induction"}
                        </span>
                      ) : isQueued ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Requested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToQueue(row)}
                          disabled={isPending}
                          title={isEbright ? "Promotes the ebrightleads candidate into HRFS and queues an induction." : undefined}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          {isPending ? "Adding…" : "Add to Induction Queue"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
          )}

          {showOffboarding && (
          /* Offboarding card */
          <article className="bg-white border border-slate-200 rounded-2xl p-6">
            <header className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="bg-rose-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  <UserMinus className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Offboarding</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Leaving in the next 2 weeks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
                  {exits.length}
                </div>
                <div className="mt-1 text-xs">
                  <span className="font-semibold text-rose-700">{exitsUrgent}</span>
                  <span className="text-slate-500"> within 1 week</span>
                </div>
              </div>
            </header>

            {exits.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 italic">
                No upcoming exits.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {exits.map((row) => {
                  const isEbright = row.source === "ebrightleads";
                  const isPending = pending.has(row.key);
                  const isQueued = row.hasPendingRequest;
                  const hasInduction = row.inductionProfileStatus !== null;
                  const errorMsg = errors.get(row.key);
                  const rowBg = row.isWithin7Days
                    ? "bg-rose-50 border-rose-200"
                    : "bg-slate-50 border-slate-200";
                  return (
                    <li
                      key={row.key}
                      className={`rounded-xl border ${rowBg} p-3 flex flex-wrap items-center gap-3`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm text-slate-900 truncate">{row.fullName}</p>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              row.isWithin7Days
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {dayLabel(row.daysUntilEnd)}
                          </span>
                          {isEbright && (
                            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              ebrightleads
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {row.email ?? row.departmentName ?? "—"} · {row.position ?? "—"} · {row.departmentName ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Leaves {row.endDate}</p>
                        {errorMsg && (
                          <p className="text-xs text-red-700 mt-1 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                            {errorMsg}
                          </p>
                        )}
                      </div>
                      {hasInduction ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          {row.inductionProfileStatus === "Completed"
                            ? "Induction Completed"
                            : "In Induction"}
                        </span>
                      ) : isQueued ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Requested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToQueue(row)}
                          disabled={isPending}
                          title={isEbright ? "Promotes the ebrightleads candidate into HRFS and queues an induction." : undefined}
                          className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
                          {isPending ? "Adding…" : "Add to Induction Queue"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
          )}
        </div>

        <div className="space-y-6">
          {showOnboarding && (
            <InteractiveWorkflowSection
              kind="Onboarding"
              templateSteps={WORKFLOW_TEMPLATES.Standard}
              ownInduction={ownInduction}
              isManager={isManager}
              substepTemplates={substepTemplates}
              departments={departments}
            />
          )}
          {showOffboarding && (
            <InteractiveWorkflowSection
              kind="Offboarding"
              templateSteps={OFFBOARDING_WORKFLOW}
              ownInduction={ownInduction}
              isManager={isManager}
              substepTemplates={substepTemplates}
              departments={departments}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface InteractiveWorkflowSectionProps {
  kind: "Onboarding" | "Offboarding";
  templateSteps: readonly WorkflowStepTemplate[];
  ownInduction: InductionView | null;
  isManager: boolean;
  substepTemplates: SubstepTemplateView[];
  departments: DepartmentOption[];
}

function InteractiveWorkflowSection({
  kind,
  templateSteps,
  ownInduction,
  isManager,
  substepTemplates,
  departments,
}: InteractiveWorkflowSectionProps) {
  const ownInductionMatchesKind =
    ownInduction !== null && ownInduction.inductionType === kind;
  const showInteractiveChecklist = ownInductionMatchesKind;

  // Manager-side workflow switcher state. Only used when previewing reference
  // workflows (i.e. the viewer doesn't have an active induction of this kind).
  // Default is "Standard" = Regular Intern · HQ.
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("Standard");

  // Department selector for the Department Training sub-workflow. Defaults
  // to the first department in the list so managers see something on load
  // without having to pick one first.
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(
    departments[0]?.id ?? null,
  );

  // Active template for substep lookup — own induction uses its real template,
  // manager preview uses whichever template the switcher has selected.
  const activeTemplateKey = ownInductionMatchesKind && ownInduction
    ? ownInduction.workflowTemplate
    : selectedTemplateKey;

  // Inductee viewing their own induction → use their employment department.
  // Manager previewing → use the dropdown selection.
  const activeDepartmentId = ownInductionMatchesKind && ownInduction
    ? ownInduction.departmentId
    : selectedDepartmentId;

  const substepsByParent = groupSubstepsByParent(
    substepTemplates,
    activeTemplateKey,
    activeDepartmentId,
  );

  const subtitle = ownInductionMatchesKind
    ? `Tracking your ${kind.toLowerCase()} progress.`
    : `Reference workflow for ${kind === "Onboarding" ? "new hires" : "exits"}.`;

  if (kind === "Onboarding") {
    // For manager preview, pick the steps from the currently-selected template
    // in the switcher. For the inductee's own view, use their real steps.
    const previewTemplate =
      WORKFLOW_TEMPLATES[selectedTemplateKey] ?? WORKFLOW_TEMPLATES.Standard;
    const stepsToRender: InductionStepView[] = ownInductionMatchesKind
      ? ownInduction.steps
      : templateToPreviewSteps(previewTemplate);

    const startDate = ownInductionMatchesKind && ownInduction
      ? ownInduction.startDate
      : PREVIEW_START_DATE;
    const activeTemplateMeta =
      EMPLOYEE_TYPE_TEMPLATES.find((t) => t.key === selectedTemplateKey) ??
      EMPLOYEE_TYPE_TEMPLATES[0];
    const swimlaneSubtitle = showInteractiveChecklist
      ? "Tracking your onboarding progress — click a task to mark it done."
      : `Reference workflow for ${activeTemplateMeta.short} · ${activeTemplateMeta.location}. ${
          isManager
            ? "Switch tabs to see the workflow for each employee type."
            : ""
        }`;
    const swimlaneTitle = showInteractiveChecklist
      ? "Onboarding workflow"
      : `Onboarding workflow — ${activeTemplateMeta.short}`;

    return (
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Template + department switcher — only shown in manager / preview mode */}
        {!showInteractiveChecklist && (
          <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                View workflow by employee type
              </p>
              <div className="flex flex-wrap gap-2">
                {EMPLOYEE_TYPE_TEMPLATES.map((t) => {
                  const isActive = selectedTemplateKey === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedTemplateKey(t.key)}
                      className={
                        isActive
                          ? `inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${t.accent} px-3 py-1.5 text-xs font-bold text-white shadow ring-2 ring-white`
                          : "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                      }
                      title={workflowTemplateLabel(t.key)}
                    >
                      <span>{t.short}</span>
                      <span className={isActive ? "text-white/80" : "text-slate-400"}>
                        · {t.location}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {departments.length > 0 && (
              <div>
                <label
                  htmlFor="dept-switcher"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  🏢 Department Training is for…
                </label>
                <select
                  id="dept-switcher"
                  value={selectedDepartmentId ?? ""}
                  onChange={(e) =>
                    setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  Inductees in this department will auto-load this sub-workflow when they
                  reach the Department Training step.
                </p>
              </div>
            )}
          </div>
        )}
        <OnboardingWorkflow
          steps={stepsToRender}
          startDate={startDate}
          token={showInteractiveChecklist && ownInduction ? ownInduction.linkToken : undefined}
          canMarkComplete={showInteractiveChecklist}
          title={swimlaneTitle}
          subtitle={swimlaneSubtitle}
          // Manager preview — phase locking only applies on the per-employee
          // induction link, not on the reference workflow shown here.
          enforceLocking={false}
          substepsByParent={substepsByParent}
          templateKey={activeTemplateKey}
          canManageSubsteps={isManager && !showInteractiveChecklist}
          currentDepartmentId={activeDepartmentId}
          departments={departments}
        />
      </article>
    );
  }

  // Offboarding fallback uses the legacy WorkflowDiagram path — single template,
  // no switcher needed.
  const stepsToRender: InductionStepView[] = ownInductionMatchesKind
    ? ownInduction.steps
    : templateToPreviewSteps(templateSteps);

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{kind} workflow</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <WorkflowDiagram steps={stepsToRender} />
        </div>
        <div>
          {showInteractiveChecklist && ownInduction ? (
            <TrainingChecklist
              steps={ownInduction.steps}
              token={ownInduction.linkToken}
              canMarkComplete
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Read-only reference
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isManager
                  ? `This is the reference ${kind.toLowerCase()} workflow. To mark steps complete, open a specific employee's induction link from the Control Centre.`
                  : `This is the reference ${kind.toLowerCase()} workflow. ${
                      ownInduction && !ownInductionMatchesKind
                        ? "Your active induction is a different type."
                        : "You don't have an active induction profile of this type."
                    }`}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
