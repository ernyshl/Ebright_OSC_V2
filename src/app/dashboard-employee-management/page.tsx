import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import EmployeeListView from "@/app/components/EmployeeListView";
import type {
  CandidatePanelRow,
  OverviewStats,
} from "@/app/components/EmployeeDashboardOverviewSection";
import { listEmployees, listBranches, listDepartments } from "@/lib/employeeQueries";

export const dynamic = "force-dynamic";

export default async function EmployeeManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [
    employees,
    branches,
    departments,
    totalStaff,
    branchCount,
    departmentCount,
    onboardingActive,
    onboardingCompleted,
    candidates,
  ] = await Promise.all([
    listEmployees(),
    listBranches(),
    listDepartments(),
    prisma.users.count({ where: { status: "active" } }),
    prisma.branch.count(),
    prisma.department.count(),
    prisma.induction_profile.count({
      where: {
        induction_type: "Onboarding",
        status: { in: ["Sent", "In Progress", "Created"] },
      },
    }),
    prisma.induction_profile.count({
      where: { induction_type: "Onboarding", status: "Completed" },
    }),
    fetchOnboardingCandidates(),
  ]);

  const stats: OverviewStats = {
    totalStaff,
    branchCount,
    departmentCount,
    onboardingActive,
    onboardingCompleted,
  };

  const userEmail = session.user?.email ?? "";
  const userRole = (session.user as { role?: string } | undefined)?.role ?? "";
  const userName = session.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <EmployeeListView
        employees={employees}
        branches={branches}
        departments={departments}
        overviewStats={stats}
        candidates={candidates}
      />
    </AppShell>
  );
}

/**
 * Onboarding candidates feed for the Onboarding/Completed click-to-open
 * panel on the employee dashboard. Includes the most recent active
 * employment per user so we can show their department + branch code in
 * the table.
 *
 * Capped at 50 in the panel itself, but we fetch up to 200 here so the
 * client-side "active vs completed" filter has enough headroom in either
 * direction.
 */
async function fetchOnboardingCandidates(): Promise<CandidatePanelRow[]> {
  const rows = await prisma.induction_profile.findMany({
    where: { induction_type: "Onboarding" },
    include: {
      user: {
        include: {
          user_profile: { select: { full_name: true } },
          employment: {
            where: { status: { in: ["active", "onboarding"] } },
            orderBy: { start_date: "desc" },
            take: 1,
            include: {
              branch: { select: { branch_code: true } },
              department: { select: { department_name: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  type Row = (typeof rows)[number];
  return rows.map((p: Row) => ({
    id: p.id,
    userId: p.user_id,
    employeeName: p.user.user_profile?.full_name ?? p.user.email,
    employeeEmail: p.user.email,
    workflowTemplate: p.workflow_template,
    status: p.status,
    departmentName: p.user.employment[0]?.department?.department_name ?? null,
    branchCode: p.user.employment[0]?.branch?.branch_code ?? null,
  }));
}
