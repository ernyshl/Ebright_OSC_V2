"use client";

import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import {
  departmentColor,
  statusPillClasses,
  TRIGGER_OPTIONS,
  type WorkflowMock,
} from "@/lib/workflow-mock-data";

interface Props {
  workflow: WorkflowMock;
  /** When true, fields render as editable (Superadmin/HOD + ?edit=1). */
  canEdit: boolean;
}

const actorBadgeClasses: Record<string, string> = {
  Candidate: "bg-blue-50 text-blue-700 border-blue-200",
  HOD: "bg-purple-50 text-purple-700 border-purple-200",
  HR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Buddy: "bg-amber-50 text-amber-700 border-amber-200",
  System: "bg-slate-50 text-slate-700 border-slate-200",
};

const typeBadgeClasses: Record<string, string> = {
  Task: "bg-slate-100 text-slate-700",
  Submission: "bg-blue-100 text-blue-700",
  Meeting: "bg-amber-100 text-amber-700",
  "Sign-off": "bg-emerald-100 text-emerald-700",
  Reading: "bg-violet-100 text-violet-700",
};

export function WorkflowDetailView({ workflow, canEdit }: Props) {
  const triggerLabel = TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger)?.label ?? workflow.trigger;
  const deptColor = departmentColor(workflow.department);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 pt-4 pb-10">
        {/* ── BREADCRUMB ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/workflow-center" className="hover:text-slate-900">Workflow Center</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium truncate">{workflow.name}</span>
        </nav>

        {/* ── BACK + ACTION ROW ── */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboards/workflow-center"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Workflow Center
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                title="Save action — needs workflow_template table (Phase E.2)"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled
                title="Publish action — needs workflow_template table (Phase E.2)"
                className="rounded-md bg-emerald-300 px-3 py-1.5 text-xs font-semibold text-white cursor-not-allowed"
              >
                Publish
              </button>
            </div>
          )}
        </div>

        {/* ── HEADER CARD ── */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {canEdit ? (
                <input
                  type="text"
                  defaultValue={workflow.name}
                  className="w-full text-xl font-semibold text-slate-900 border border-slate-300 rounded-md px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-xl font-semibold text-slate-900">{workflow.name}</h1>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: deptColor.bg, color: deptColor.text }}
                >
                  {workflow.department}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusPillClasses(workflow.status)}`}>
                  {workflow.status}
                </span>
                <span className="text-xs text-slate-500">
                  {workflow.assignedCount} candidate{workflow.assignedCount === 1 ? "" : "s"} assigned
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LINKED EMPLOYEE TYPES + TRIGGER ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Linked Employee Types</h2>
            <p className="text-xs text-slate-500 mb-3">Which employee types this workflow applies to</p>
            <div className="flex flex-wrap gap-2">
              {workflow.appliesTo.map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Trigger</h2>
            <p className="text-xs text-slate-500 mb-3">When this workflow starts</p>
            {canEdit ? (
              <select
                defaultValue={workflow.trigger}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                {TRIGGER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-semibold text-slate-700">{triggerLabel}</p>
            )}
          </div>
        </section>

        {/* ── STEP LIST ── */}
        <section aria-labelledby="steps-heading" className="bg-white border border-slate-200 rounded-2xl mb-5">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 id="steps-heading" className="text-sm font-semibold text-slate-900">Workflow Steps</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {workflow.steps.length} step{workflow.steps.length === 1 ? "" : "s"}
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  title="Add Step — drag-to-reorder coming in Phase E.2"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  ＋ Add Step
                </button>
                <button
                  type="button"
                  disabled
                  title="Add Section Header — coming in Phase E.2"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  ＋ Section Header
                </button>
              </div>
            )}
          </header>
          <ol className="divide-y divide-slate-200">
            {workflow.steps.map((step) => (
              <li key={step.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    {step.stepNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${actorBadgeClasses[step.actor] ?? actorBadgeClasses.System}`}>
                        {step.actor}
                      </span>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${typeBadgeClasses[step.type] ?? typeBadgeClasses.Task}`}>
                        {step.type}
                      </span>
                      {step.required && (
                        <span className="inline-flex items-center rounded bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-semibold border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{step.description}</p>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Due {step.dueDaysAfterStart === 0
                        ? "on day of workflow start"
                        : `${step.dueDaysAfterStart} day${step.dueDaysAfterStart === 1 ? "" : "s"} after start`}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled
                      title="Delete step — Phase E.2"
                      className="text-xs font-semibold text-slate-400 cursor-not-allowed"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── WORKFLOW LINKS ── */}
        <section aria-labelledby="links-heading" className="bg-white border border-slate-200 rounded-2xl">
          <header className="px-5 py-4 border-b border-slate-200">
            <h2 id="links-heading" className="text-sm font-semibold text-slate-900">Workflow Links</h2>
            <p className="mt-0.5 text-xs text-slate-500">Connect this workflow to another that runs after this one completes</p>
          </header>
          <div className="px-5 py-4">
            {workflow.linkedAfterIds.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No linked workflows yet.</p>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {workflow.name}
                </div>
                {workflow.linkedAfterIds.map((linkedId) => (
                  <div key={linkedId} className="flex flex-col items-center">
                    <span className="text-xs text-slate-400" aria-hidden="true">↓</span>
                    <div className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                      Workflow #{linkedId}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {canEdit && (
              <button
                type="button"
                disabled
                title="Add Link — workflow chaining UI coming in Phase E.2"
                className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                ＋ Add Link
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
