import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { AdminShell } from "@/app/admin/components/AdminShell";
import { AdminOnboardingView } from "@/app/admin/components/AdminOnboardingView";
import { listAllInductionProfiles, listDepartments } from "@/app/induction/queries";
import { listBranches } from "@/lib/employeeQueries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Onboarding — Admin Console",
};

/**
 * Admin's onboarding overview page. Read-only pipeline view + Assign Role
 * action for completed candidates. Strictly admin/superadmin only — enforced
 * by the parent /admin route-group layout.
 *
 * Differences from HR's onboarding-dashboard:
 *   - Branch column added (admin oversees all branches)
 *   - No search / category filter / pending requests (HR responsibilities)
 *   - Action becomes "Assign Role" once status = Completed
 *   - Completion alert strip surfaces ready-for-role candidates
 */
export default async function AdminOnboardingPage() {
  const session = await getServerSession(authOptions);
  // Layout already redirected if no session — narrowing here for TS only.
  const userName = session?.user?.name ?? null;

  const [allProfiles, branches, departments, branchByUserId, activeUsers] = await Promise.all([
    listAllInductionProfiles(),
    listBranches(),
    listDepartments(),
    fetchBranchByUserId(),
    fetchActiveUsersForReportsTo(),
  ]);

  // Only Onboarding profiles (not Offboarding), only active (not archived),
  // and not yet role-assigned. The "Assigned" status marks candidates who've
  // already been promoted out of the pipeline via the Assign Role modal.
  const onboardingProfiles = allProfiles.filter(
    (p) => p.inductionType !== "Offboarding" && !p.isArchived && p.status !== "Assigned",
  );

  // Active candidate count for sidebar badge: sent + in progress.
  const activeCount = onboardingProfiles.filter(
    (p) => p.status === "Sent" || p.status === "In Progress" || p.status === "Created",
  ).length;

  return (
    <AdminShell topbarTitle="Onboarding" onboardingCount={activeCount} userName={userName}>
      <AdminOnboardingView
        profiles={onboardingProfiles}
        branches={branches}
        departments={departments}
        branchByUserId={branchByUserId}
        activeUsers={activeUsers}
      />
    </AdminShell>
  );
}

/**
 * Single query that returns { userId → branchName } for every user with an
 * active employment row. Used by AdminOnboardingView to render the Branch
 * column without changing PendingInductionRow's shape (which is shared with
 * HR's dashboard + control centre).
 */
async function fetchBranchByUserId(): Promise<Record<number, string | null>> {
  const rows = await prisma.employment.findMany({
    where: { status: { in: ["active", "onboarding"] } },
    include: { branch: { select: { branch_name: true } } },
    orderBy: { start_date: "desc" },
  });
  const out: Record<number, string | null> = {};
  for (const r of rows) {
    // First (most recent) wins — many users have a single employment row;
    // for those with multiple, the most-recent-start one is the canonical.
    if (!(r.user_id in out)) {
      out[r.user_id] = r.branch?.branch_name ?? null;
    }
  }
  return out;
}

interface ActiveUserOption {
  userId: number;
  fullName: string;
  email: string;
  position: string | null;
}

/**
 * Active users for the "Reports To" dropdown in the Assign Role modal. Only
 * superadmin / hr / hod / ceo are reasonable reporting targets — filtering
 * out staff and other low-privilege roles so HR doesn't accidentally pick a
 * coach as someone's manager.
 */
async function fetchActiveUsersForReportsTo(): Promise<ActiveUserOption[]> {
  const REPORTS_TO_ROLES = new Set(["superadmin", "ceo", "admin", "hr", "od", "hod"]);
  const rows = await prisma.users.findMany({
    where: { status: "active" },
    include: {
      user_profile: { select: { full_name: true } },
      role: { select: { role_type: true } },
      employment: {
        where: { status: "active" },
        orderBy: { start_date: "desc" },
        take: 1,
        select: { position: true },
      },
    },
    orderBy: { email: "asc" },
  });
  type Row = (typeof rows)[number];
  return rows
    .filter((u: Row) => REPORTS_TO_ROLES.has((u.role?.role_type ?? "").toLowerCase()))
    .map((u: Row) => ({
      userId: u.user_id,
      fullName: u.user_profile?.full_name ?? u.email,
      email: u.email,
      position: u.employment[0]?.position ?? null,
    }));
}
