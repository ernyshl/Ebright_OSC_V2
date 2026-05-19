"use client";

import { useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronRight, Search } from "lucide-react";
import EmployeeDetailModal from "./EmployeeDetailModal";
import type { PendingInductionRow } from "@/app/induction/queries";

interface Props {
  rows: PendingInductionRow[];
}

export default function ArchivedInductionsSection({ rows }: Props) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [openUser, setOpenUser] = useState<{ userId: number; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeEmail.toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 border-b border-slate-100 text-left hover:bg-slate-50/60"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Archive className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Archive — past induction window
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Inductions whose start date is more than 5 days old. Data is preserved here
              for review but no longer counts in the active list.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {rows.length} archived
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      {open && (
        <>
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-sm">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search archived employees by name or email…"
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No archived inductions match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Employee</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Type</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Start</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Final progress</th>
                    <th scope="col" className="px-6 py-3 text-left font-medium">Final status</th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => {
                    const pct =
                      row.totalSteps > 0
                        ? Math.round((row.completedSteps / row.totalSteps) * 100)
                        : 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenUser({ userId: row.userId, name: row.employeeName })
                            }
                            className="text-left font-medium text-slate-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                            title="View induction details + evidence"
                          >
                            {row.employeeName}
                          </button>
                          <div className="text-xs text-slate-500">{row.employeeEmail}</div>
                        </td>
                        <td className="px-6 py-3 text-slate-600">{row.inductionType}</td>
                        <td className="px-6 py-3 text-slate-600">{row.startDate}</td>
                        <td className="px-6 py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {row.completedSteps}/{row.totalSteps}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              row.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenUser({ userId: row.userId, name: row.employeeName })
                            }
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {openUser && (
        <EmployeeDetailModal
          userId={openUser.userId}
          fallbackName={openUser.name}
          onClose={() => setOpenUser(null)}
        />
      )}
    </section>
  );
}
