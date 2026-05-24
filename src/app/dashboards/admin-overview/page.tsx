import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { AdminOverviewView, type UserRow } from "./AdminOverviewView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Overview",
};

/**
 * Admin Overview — system-wide management view. Renders inside the existing
 * portal layout (AppShell + top-level portal Sidebar). Admin / superadmin only.
 *
 * What this page shows (per spec, Branch Overview was REMOVED in Phase D):
 *   - 5 stat cards (Total Staff, Branches, Departments, Onboarding, Completed)
 *   - User Management table (read-only list, +Add disabled — no creation flow yet)
 *   - Recent Activity placeholder (no audit log subsystem yet)
 *   - System Settings (3 read-only placeholders)
 */
export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();
  if (roleType !== "admin" && roleType !== "superadmin") {
    redirect("/dashboards/hrms");
  }

  const [
    totalStaff,
    branchCount,
    departmentsCount,
    onboardingActive,
    onboardingCompleted,
    userRows,
  ] = await Promise.all([
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
    fetchUserRows(),
  ]);

  return (
    <AppShell
      email={session.user.email}
      role={actor?.role?.role_type ?? ""}
      name={session.user.name ?? null}
    >
      <AdminOverviewView
        stats={{
          totalStaff,
          branchCount,
          departmentCount: departmentsCount,
          onboardingActive,
          onboardingCompleted,
        }}
        users={userRows}
      />
    </AppShell>
  );
}

/**
 * User list for the User Management table — non-deleted users with role,
 * department, branch, and active status. Same shape as AccountManagementView
 * uses, kept inline here so this page is self-contained.
 */
async function fetchUserRows(): Promise<UserRow[]> {
  const users = await prisma.users.findMany({
    include: {
      user_profile: { select: { full_name: true } },
      role: { select: { role_type: true } },
      employment: {
        where: { status: { in: ["active", "onboarding"] } },
        orderBy: { start_date: "desc" },
        take: 1,
        include: {
          branch: { select: { branch_code: true, branch_name: true } },
          department: { select: { department_name: true } },
        },
      },
    },
    orderBy: { email: "asc" },
    take: 50, // cap at first 50 for the overview page — full list lives in /account-management
  });

  type Row = (typeof users)[number];
  return users.map((u: Row) => ({
    userId: u.user_id,
    email: u.email,
    fullName: u.user_profile?.full_name ?? u.email,
    roleType: u.role?.role_type ?? "—",
    departmentName: u.employment[0]?.department?.department_name ?? null,
    branchCode: u.employment[0]?.branch?.branch_code ?? null,
    isActive: u.status === "active",
  }));
}
