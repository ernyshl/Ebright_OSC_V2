"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingInductionRow, DepartmentOption } from "@/app/induction/queries";
import type { BranchOpt } from "@/lib/employeeQueries";
import { AssignRoleModal, type ActiveUserOption } from "./AssignRoleModal";

interface Props {
  profiles: PendingInductionRow[];
  branches: BranchOpt[];
  departments: DepartmentOption[];
  /** userId → branchName lookup map, built by the page. */
  branchByUserId: Record<number, string | null>;
  activeUsers: ActiveUserOption[];
}

// ─── HELPERS ───
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const TEMPLATE_LABEL: Record<string, string> = {
  Standard: "Regular Intern",
  ProtegeInternBranch: "Protege Intern",
  CoachPartTimer: "Coach (PT)",
  CoachFullTimer: "Coach (FT)",
  FullTimer: "Full-timer (HQ)",
};

function statusBadge(status: string): { bg: string; text: string; border: string } {
  if (status === "Completed")
    return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
  if (status === "In Progress")
    return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
  if (status === "Sent" || status === "Created")
    return { bg: "#FFFBEB", text: "#D97706", border: "#FED7AA" };
  return { bg: "#F5F5F0", text: "#555", border: "#E5E5E0" };
}

export function AdminOnboardingView({
  profiles,
  branches,
  departments,
  branchByUserId,
  activeUsers,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [assigningProfile, setAssigningProfile] = useState<PendingInductionRow | null>(null);

  // ─── STATS ───
  let total = 0, completed = 0, inProgress = 0, notStarted = 0;
  const completedProfiles: PendingInductionRow[] = [];
  for (const p of profiles) {
    total += 1;
    if (p.status === "Completed") {
      completed += 1;
      completedProfiles.push(p);
    } else if (p.status === "In Progress") {
      inProgress += 1;
    } else if (p.status === "Sent" || p.status === "Created") {
      notStarted += 1;
    }
  }

  const handleAssignSuccess = () => {
    setAssigningProfile(null);
    startTransition(() => router.refresh());
  };

  return (
    <>
      {/* ── PAGE HEADER ── */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Onboarding</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Pipeline overview — all departments and branches
          </p>
        </div>
      </header>

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Onboarding" value={total} subtitle="Active pipeline." accent="#2563EB" />
        <StatCard label="Completed" value={completed} subtitle="All days done." accent="#16A34A" />
        <StatCard label="In Progress" value={inProgress} subtitle="Actively training." accent="#D97706" />
        <StatCard label="Not Started" value={notStarted} subtitle="Link sent, awaiting." accent="#DC2626" />
      </div>

      {/* ── COMPLETION ALERT STRIP ── */}
      {completedProfiles.length > 0 && (
        <div
          className="mb-5 rounded-lg border px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
        >
          <p className="text-sm text-slate-800 flex items-center gap-2">
            <span aria-hidden="true">🎉</span>
            <span>
              <strong className="font-semibold">
                {completedProfiles.length} candidate{completedProfiles.length === 1 ? "" : "s"}
              </strong>{" "}
              completed induction and {completedProfiles.length === 1 ? "is" : "are"} ready for role
              assignment.
            </span>
          </p>
          <a
            href="#completed-table-section"
            className="text-xs font-semibold rounded-md px-3 py-1.5 hover:brightness-95"
            style={{ background: "#16A34A", color: "#fff" }}
          >
            Review →
          </a>
        </div>
      )}

      {/* ── CANDIDATES TABLE ── */}
      <section
        id="completed-table-section"
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1px solid #E5E5E0" }}
      >
        <header
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #E5E5E0" }}
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Onboarding Candidates
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px] font-bold px-1.5"
              style={{ background: "#F5F5F0", color: "#555" }}
            >
              {total}
            </span>
          </h2>
        </header>

        {total === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 italic">
            No active candidates in the pipeline.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: "#FAFAFA", borderBottom: "1px solid #E5E5E0" }}>
                <tr>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dept / Role</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider sr-only">Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const pct = p.totalSteps > 0 ? Math.round((p.completedSteps / p.totalSteps) * 100) : 0;
                  const badge = statusBadge(p.status);
                  const branchName = branchByUserId[p.userId] ?? "—";
                  const isCompleted = p.status === "Completed";
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid #E5E5E0" }}
                      className="hover:bg-[#FAFAF8]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "#EFF6FF", color: "#2563EB" }}
                            aria-hidden="true"
                          >
                            {initialsFromName(p.employeeName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{p.employeeName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{p.employeeEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">
                        {TEMPLATE_LABEL[p.workflowTemplate] ?? p.workflowTemplate}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">—</td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-700">{branchName}</td>
                      <td className="px-3 py-3 text-xs text-slate-700 whitespace-nowrap">
                        {formatDateShort(p.startDate)}
                      </td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <p className="text-[11px] text-slate-600 mb-1">
                          {p.completedSteps}/{p.totalSteps} steps
                        </p>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#2563EB" }} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            borderColor: badge.border,
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setAssigningProfile(p)}
                            className="inline-flex items-center text-xs font-semibold rounded-md px-3 py-1.5 hover:brightness-95"
                            style={{ background: "#16A34A", color: "#fff" }}
                          >
                            Assign Role →
                          </button>
                        ) : (
                          <Link
                            href={`/induction/${p.linkToken}`}
                            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── ASSIGN ROLE MODAL ── */}
      {assigningProfile && (
        <AssignRoleModal
          profile={assigningProfile}
          branches={branches}
          departments={departments}
          activeUsers={activeUsers}
          onClose={() => setAssigningProfile(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </>
  );
}

// ─── STAT CARD ───
function StatCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: number;
  subtitle: string;
  accent: string;
}) {
  return (
    <div
      className="relative bg-white rounded-xl p-4 overflow-hidden"
      style={{ border: "1px solid #E5E5E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} aria-hidden="true" />
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-[28px] font-bold text-slate-900 leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}
