import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { canManageInductions } from "@/app/induction/roles";
import { LifecycleCard } from "@/app/induction/components/LifecycleCard";
import { LeaveCard } from "@/app/induction/components/LeaveCard";
import {
  shouldRunSync,
  syncAllFromEbrightLeads,
} from "@/app/induction/jobs/sync-onboarding";
import {
  getCombinedAnnualLeavesUpcoming,
  getCombinedMcLeavesPastWeek,
  listAllInductionProfiles,
} from "@/app/induction/queries";
import { listOffboardingCases } from "@/lib/offboarding/queries";
import { workflowTemplateLabel } from "@/app/induction/templates";

async function maybeAutoSync(): Promise<void> {
  try {
    if (await shouldRunSync()) {
      await syncAllFromEbrightLeads();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[induction] auto-sync skipped:", msg);
  }
}

/** Whole days from UTC-today until the given YYYY-MM-DD date (negative if past). */
function daysUntilUtc(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HR Dashboard",
};

export default async function HrDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const canManage = canManageInductions(actor?.role?.role_type ?? null);
  if (!canManage) redirect("/dashboards/hrms");

  await maybeAutoSync();

  const [allProfiles, offboardingCases, mcLeaves, annualLeaves] = await Promise.all([
    listAllInductionProfiles(),
    listOffboardingCases(),
    getCombinedMcLeavesPastWeek(),
    getCombinedAnnualLeavesUpcoming(),
  ]);

  // #5: Onboarding card now reflects the SAME pool as the Onboarding Page —
  // onboarding induction profiles (excluding offboarding + role-assigned),
  // not the upcoming-hires date-window forecast.
  const onboardingProfiles = allProfiles.filter(
    (p) => p.inductionType !== "Offboarding" && p.status !== "Assigned",
  );

  const onboardingPreview = onboardingProfiles.slice(0, 8).map((p) => {
    const daysUntilStart = daysUntilUtc(p.startDate);
    return {
      key: String(p.id),
      title: p.employeeName,
      subtitle: workflowTemplateLabel(p.workflowTemplate),
      meta: `${p.status} · ${p.completedSteps}/${p.totalSteps} steps`,
      highlight: daysUntilStart >= 0 && daysUntilStart <= 7,
    };
  });

  // #5: Offboarding card now reflects the actual offboarding pipeline —
  // offboarding_case records from the Offboarding module.
  const offboardingPreview = offboardingCases.slice(0, 8).map((c) => ({
    key: String(c.id),
    title: c.employeeName,
    subtitle: [c.departmentName, c.branchCode].filter(Boolean).join(" · ") || null,
    meta: c.lastWorkingDay ? `LWD ${c.lastWorkingDay} · ${c.status}` : c.status,
    highlight:
      c.daysUntilLastDay !== null &&
      c.daysUntilLastDay >= 0 &&
      c.daysUntilLastDay <= 7,
  }));

  const userEmail = session.user.email;
  const userRole = actor?.role?.role_type ?? "";
  const userName = session.user.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
            <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  HR Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-600">Employee Lifecycle Data</p>
              </div>
              <Link
                href="/dashboards/hrms"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to HRMS
              </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LifecycleCard
                variant="onboarding"
                total={onboardingProfiles.length}
                windowLabel="Active induction pipeline"
                previewItems={onboardingPreview}
              />
              <LifecycleCard
                variant="offboarding"
                total={offboardingCases.length}
                windowLabel="Active offboarding cases"
                previewItems={offboardingPreview}
              />
              <LeaveCard variant="mc" rows={mcLeaves} />
              <LeaveCard variant="annual-leave" rows={annualLeaves} />
            </div>
          </div>
        </div>
    </AppShell>
  );
}
