"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BranchCardData {
  id: number;
  code: string;
  name: string;
  location: string | null;
  onboardingCount: number;
  coachesCount: number;
  completedCount: number;
  isHQ: boolean;
}

export interface UserRow {
  userId: number;
  email: string;
  fullName: string;
  roleType: string;
  departmentName: string | null;
  branchCode: string | null;
  isActive: boolean;
}

interface Stats {
  totalStaff: number;
  branchCount: number;
  departmentCount: number;
  onboardingActive: number;
  onboardingCompleted: number;
}

interface Props {
  stats: Stats;
  branches: BranchCardData[];
  users: UserRow[];
}

// ─── HELPERS ───
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function rolePillClasses(role: string): string {
  const r = role.toLowerCase();
  if (r === "admin" || r === "superadmin") return "bg-slate-900 text-white";
  if (r === "hr" || r === "od") return "bg-blue-700 text-white";
  if (r === "hod") return "bg-purple-700 text-white";
  if (r === "ceo") return "bg-amber-700 text-white";
  return "bg-slate-200 text-slate-700";
}

export function AdminOverviewView({ stats, branches, users }: Props) {
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
          <span className="text-slate-900 font-medium">Admin Overview</span>
        </nav>

        {/* ── HEADER ── */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Admin Overview</h1>
            <p className="mt-2 text-sm text-slate-600">System-wide management — eBright Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Export coming in a future PR"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
            >
              ↓ Export
            </button>
            <button
              type="button"
              disabled
              title="Add User flow coming in a future PR (Phase 4)"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
            >
              ＋ Add User
            </button>
          </div>
        </header>

        {/* ── 5 STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Staff" value={stats.totalStaff} subtitle="Active accounts" accentClass="bg-blue-500" />
          <StatCard label="Branches" value={stats.branchCount} subtitle="HQ + others" accentClass="bg-violet-500" />
          <StatCard label="Departments" value={stats.departmentCount} subtitle="Across branches" accentClass="bg-teal-500" />
          <StatCard label="Onboarding" value={stats.onboardingActive} subtitle="Active candidates" accentClass="bg-amber-500" />
          <StatCard label="Completed" value={stats.onboardingCompleted} subtitle="This cycle" accentClass="bg-emerald-500" />
        </div>

        {/* ── BRANCH OVERVIEW ── */}
        <section aria-labelledby="branches-heading" className="bg-white border border-slate-200 rounded-2xl mb-6">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 id="branches-heading" className="text-sm font-semibold text-slate-900">🏢 Branch Overview</h2>
              <p className="mt-0.5 text-xs text-slate-500">All eBright locations — HQ and branches</p>
            </div>
            <button
              type="button"
              disabled
              title="Branch CRUD coming in a future PR"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
            >
              ＋ Add Branch
            </button>
          </header>
          {branches.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 italic">No branches configured.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {branches.map((b) => (
                <article
                  key={b.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                      {b.code || "—"}
                    </span>
                    {b.isHQ && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        HQ
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{b.name}</p>
                  <p className="text-xs text-rose-600 mt-1">📍 {b.location ?? "—"}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-bold text-slate-900 tabular-nums">{b.onboardingCount}</p>
                      <p className="text-[10px] text-amber-700 font-semibold">Onboarding</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 tabular-nums">{b.coachesCount}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">Coaches</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 tabular-nums">{b.completedCount}</p>
                      <p className="text-[10px] text-blue-700 font-semibold">Completed</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── USER MANAGEMENT + RECENT ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Management (spans 2 cols) */}
          <section aria-labelledby="users-heading" className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 id="users-heading" className="text-sm font-semibold text-slate-900">👤 User Management</h2>
                <p className="mt-0.5 text-xs text-slate-500">HR staff, coaches, department heads (first 50 — full list at /account-management)</p>
              </div>
              <Link
                href="/account-management"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            </header>
            {users.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 italic">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0"
                              aria-hidden="true"
                            >
                              {initialsFromName(u.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{u.fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${rolePillClasses(u.roleType)}`}>
                            {u.roleType}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-700">{u.departmentName ?? "—"}</td>
                        <td className="px-3 py-3 text-xs font-mono text-slate-700">{u.branchCode ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                              aria-hidden="true"
                            />
                            <span className={u.isActive ? "text-slate-900" : "text-slate-500"}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Activity (1 col, placeholder) */}
          <section aria-labelledby="activity-heading" className="bg-white border border-slate-200 rounded-2xl">
            <header className="px-5 py-4 border-b border-slate-200">
              <h2 id="activity-heading" className="text-sm font-semibold text-slate-900">📜 Recent Activity</h2>
            </header>
            <div className="px-5 py-8 text-center">
              <p className="text-3xl mb-2" aria-hidden="true">🔜</p>
              <p className="text-sm text-slate-700 font-semibold">Audit log coming soon</p>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                The audit log subsystem (task completion, role assignment, link sent, request accept/decline, etc.) is a separate PR. This panel will list real activity once it's built.
              </p>
            </div>
          </section>
        </div>

        {/* ── SYSTEM SETTINGS ── */}
        <section aria-labelledby="settings-heading" className="bg-white border border-slate-200 rounded-2xl">
          <header className="px-5 py-4 border-b border-slate-200">
            <h2 id="settings-heading" className="text-sm font-semibold text-slate-900">⚙️ System Settings</h2>
            <p className="mt-0.5 text-xs text-slate-500">Onboarding-related configuration (read-only placeholders — edit flow is a future PR)</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
            <SettingPlaceholder
              icon="📧"
              label="Induction Link Sender"
              description="Email used to send induction links"
              value="hr@ebright.my"
            />
            <SettingPlaceholder
              icon="🗓"
              label="Induction Cycle"
              description="Current intake cycle"
              value="May 2026 — Batch 02"
            />
            <SettingPlaceholder
              icon="🔗"
              label="Induction Training"
              description="Linked flowchart page"
              value="Induction_Training…html"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ───
function StatCard({
  label,
  value,
  subtitle,
  accentClass,
}: {
  label: string;
  value: number;
  subtitle: string;
  accentClass: string;
}) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentClass}`} aria-hidden="true" />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function SettingPlaceholder({
  icon,
  label,
  description,
  value,
}: {
  icon: string;
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3.5">
      <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{description}</p>
      <p className="mt-2 font-mono text-xs bg-slate-50 px-2 py-1.5 rounded text-slate-700">
        {value}
      </p>
    </div>
  );
}
