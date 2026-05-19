"use client";

import { useState } from "react";
import EmployeeDetailModal from "./EmployeeDetailModal";

export interface HireRow {
  key: string;
  source: "local" | "ebrightleads";
  userId: number | null;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  startDate: string;
  isWithin7Days: boolean;
}

interface Props {
  rows: HireRow[];
}

export default function HiresTableBody({ rows }: Props) {
  const [openUserId, setOpenUserId] = useState<number | null>(null);
  const [openName, setOpenName] = useState<string | null>(null);

  function open(userId: number, name: string) {
    setOpenUserId(userId);
    setOpenName(name);
  }

  return (
    <>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
            No upcoming hires in the next 6 months.
          </td>
        </tr>
      ) : (
        rows.map((h, i) => {
          const clickable = h.userId !== null;
          return (
            <tr
              key={h.key}
              className={h.isWithin7Days ? "bg-emerald-50" : "bg-white"}
            >
              <td className="px-4 py-3 text-slate-500 tabular-nums">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {h.isWithin7Days && (
                  <span className="text-emerald-600 mr-1.5" aria-hidden="true">●</span>
                )}
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => open(h.userId as number, h.fullName)}
                    className="text-left text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    title="View induction details"
                  >
                    {h.fullName}
                  </button>
                ) : (
                  <span title="No local user record yet — induction not started">
                    {h.fullName}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-700">{h.position ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{h.departmentName ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">{h.startDate}</td>
              <td className="px-4 py-3 text-xs">
                <span
                  className={
                    h.source === "local"
                      ? "rounded bg-slate-100 px-2 py-0.5 text-slate-700"
                      : "rounded bg-blue-100 px-2 py-0.5 text-blue-700"
                  }
                >
                  {h.source === "local" ? "hrfs" : "ebrightleads"}
                </span>
              </td>
            </tr>
          );
        })
      )}

      {openUserId !== null && (
        <tr>
          <td colSpan={6} className="p-0">
            <EmployeeDetailModal
              userId={openUserId}
              fallbackName={openName}
              onClose={() => {
                setOpenUserId(null);
                setOpenName(null);
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}
