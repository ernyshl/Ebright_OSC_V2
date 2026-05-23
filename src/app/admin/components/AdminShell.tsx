import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
  topbarTitle: string;
  onboardingCount?: number;
  userName?: string | null;
}

/**
 * Admin Console shell — dark sidebar + sticky white topbar per mockup spec.
 *
 * Distinct from the portal-wide AppShell (which is used for HRMS / CRM / SMS
 * etc.). Admin pages render inside this shell via the /admin route-group
 * layout. Keeps existing portal layout 100% untouched.
 */
export function AdminShell({ children, topbarTitle, onboardingCount, userName }: Props) {
  const initials = userName
    ? userName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F5F0" }}>
      <AdminSidebar onboardingCount={onboardingCount} userName={userName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-10 bg-white border-b flex items-center justify-between px-7 h-[54px]"
          style={{ borderColor: "#E5E5E0" }}
        >
          <h1 className="text-[15px] font-bold text-slate-900">{topbarTitle}</h1>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-mono">eBright Portal Admin</span>
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "#7C3AED" }}
              aria-hidden="true"
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
