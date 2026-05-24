"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  DEPARTMENTS,
  departmentColor,
  statusPillClasses,
  type WorkflowMock,
} from "@/lib/workflow-mock-data";

interface Props {
  workflows: WorkflowMock[];
  canEdit: boolean;
  canCreateNew: boolean;
}

type DepartmentTab = "All" | (typeof DEPARTMENTS)[number];

export function WorkflowCenterView({ workflows, canEdit, canCreateNew }: Props) {
  const [activeTab, setActiveTab] = useState<DepartmentTab>("All");

  const filteredWorkflows = activeTab === "All"
    ? workflows
    : workflows.filter((w) => w.department === activeTab);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        {/* ── BREADCRUMB ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Workflow Center</span>
        </nav>

        {/* ── HEADER ── */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Workflow Center</h1>
            <p className="mt-2 text-sm text-slate-600">Department onboarding workflows — all departments</p>
          </div>
          {canCreateNew && (
            <button
              type="button"
              disabled
              title="Workflow creation modal — coming next session (needs workflow_template table)"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
            >
              ＋ New Workflow
            </button>
          )}
        </header>

        {/* ── DEPARTMENT TABS ── */}
        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-0">
          <TabButton label="All" active={activeTab === "All"} onClick={() => setActiveTab("All")} />
          {DEPARTMENTS.map((d) => (
            <TabButton
              key={d}
              label={d}
              active={activeTab === d}
              onClick={() => setActiveTab(d)}
            />
          ))}
        </div>

        {/* ── WORKFLOW LIST CARD ── */}
        <section aria-labelledby="workflows-heading" className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 id="workflows-heading" className="text-sm font-semibold text-slate-900">
                {activeTab === "All" ? "All workflows" : `${activeTab} workflows`}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredWorkflows.length} workflow{filteredWorkflows.length === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          {filteredWorkflows.length === 0 ? (
            <EmptyState canCreateNew={canCreateNew} departmentLabel={activeTab} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Workflow Name</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Applies To</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Steps</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Assigned</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredWorkflows.map((w) => {
                    const deptColor = departmentColor(w.department);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: deptColor.bg, color: deptColor.text }}
                          >
                            {w.department}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-700">
                          {w.appliesTo.join(", ")}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-slate-700 tabular-nums">{w.steps.length}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusPillClasses(w.status)}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-slate-700 tabular-nums">{w.assignedCount}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboards/workflow-center/${w.id}`}
                              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View →
                            </Link>
                            {canEdit && (
                              <Link
                                href={`/dashboards/workflow-center/${w.id}?edit=1`}
                                className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs font-semibold rounded-t-md transition ${
        active
          ? "bg-white text-blue-700 border border-slate-200 border-b-white -mb-px"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({
  canCreateNew,
  departmentLabel,
}: {
  canCreateNew: boolean;
  departmentLabel: string;
}) {
  const msg = canCreateNew
    ? `No workflows yet${departmentLabel === "All" ? "" : ` for ${departmentLabel}`}. Click ＋ New Workflow to create one.`
    : `No published workflows${departmentLabel === "All" ? "" : ` for ${departmentLabel}`} yet.`;
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-3xl mb-2" aria-hidden="true">📋</p>
      <p className="text-sm text-slate-700">{msg}</p>
    </div>
  );
}
