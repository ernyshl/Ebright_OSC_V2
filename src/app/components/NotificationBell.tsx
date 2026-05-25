"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Hourglass, UserPlus, X } from "lucide-react";

const APPROVAL_ROLES = new Set(["superadmin"]);
const INDUCTION_ROLES = new Set(["superadmin", "admin", "hr", "od"]);

interface Counts {
  approvals: number;
  inductionRequests: number;
}

export default function NotificationBell({ role }: { role?: string }) {
  const normalizedRole = (role ?? "").toLowerCase();
  const showApprovals = APPROVAL_ROLES.has(normalizedRole);
  const showInductionRequests = INDUCTION_ROLES.has(normalizedRole);
  const shouldShow = showApprovals || showInductionRequests;

  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ approvals: 0, inductionRequests: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldShow) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([
          showApprovals
            ? fetch("/api/approvals/count", { cache: "no-store" }).then((r) =>
                r.ok ? (r.json() as Promise<{ count?: number }>) : { count: 0 },
              )
            : Promise.resolve({ count: 0 }),
          showInductionRequests
            ? fetch("/api/induction-requests/count", { cache: "no-store" }).then((r) =>
                r.ok ? (r.json() as Promise<{ count?: number }>) : { count: 0 },
              )
            : Promise.resolve({ count: 0 }),
        ]);
        if (cancelled) return;
        setCounts({
          approvals: typeof a.count === "number" ? a.count : 0,
          inductionRequests: typeof b.count === "number" ? b.count : 0,
        });
      } catch {
        // network flake — no-op
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [shouldShow, showApprovals, showInductionRequests]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!shouldShow) return null;

  const totalCount = counts.approvals + counts.inductionRequests;
  const hasAny = totalCount > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={hasAny ? `Notifications: ${totalCount} pending` : "Notifications"}
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          open ? "bg-slate-100" : "hover:bg-slate-100"
        }`}
        style={{ color: "#1e293b" }}
      >
        <span className="relative inline-flex">
          <Bell className="w-6 h-6" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
          {hasAny && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                borderRadius: "9999px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 2px #ffffff",
                pointerEvents: "none",
              }}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[22rem] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {!hasAny ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">You&apos;re all caught up</p>
              <p className="mt-0.5 text-xs text-slate-500">New notifications will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {showApprovals && counts.approvals > 0 && (
                <NotificationItem
                  iconBg="bg-amber-50 ring-amber-200"
                  iconColor="text-amber-600"
                  Icon={Hourglass}
                  title="Account approval"
                  description={
                    counts.approvals === 1
                      ? "1 registration is waiting for your approval."
                      : `${counts.approvals} registrations are waiting for your approval.`
                  }
                  actionHref="/approvals"
                  actionLabel="Review"
                  onDismiss={() => setOpen(false)}
                />
              )}
              {showInductionRequests && counts.inductionRequests > 0 && (
                <NotificationItem
                  iconBg="bg-blue-50 ring-blue-200"
                  iconColor="text-blue-600"
                  Icon={UserPlus}
                  title="New candidate signed in"
                  description={
                    counts.inductionRequests === 1
                      ? "1 candidate has signed in and is waiting for onboarding approval."
                      : `${counts.inductionRequests} candidates have signed in and are waiting for onboarding approval.`
                  }
                  actionHref="/induction/onboarding-dashboard?type=onboarding"
                  actionLabel="Review"
                  onDismiss={() => setOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  iconBg,
  iconColor,
  Icon,
  title,
  description,
  actionHref,
  actionLabel,
  onDismiss,
}: {
  iconBg: string;
  iconColor: string;
  Icon: typeof Bell;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  onDismiss: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-1 ring-inset ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 -mt-0.5 -mr-1 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 leading-snug">{description}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={actionHref}
              onClick={onDismiss}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-sm"
            >
              {actionLabel}
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
