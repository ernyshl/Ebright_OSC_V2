import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { AdminOverviewView, type BranchCardData, type UserRow } from "./AdminOverviewView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Overview",
};

/**
 * Admin Overview — system-wide management view per spec v2 §5 / mockup
 * image 4. Renders inside the existing portal layout (AppShell + the
 * top-level portal Sidebar) — NO dark admin shell. Admin / superadmin only.
 *
 * What this page shows:
 *   - 5 stat cards (Total Staff, Branches, Departments, Onboarding, Completed)
 *   - Branch Overview (per-branch onboarding + coach counts)
 *   - User Management table (read-only list, +Add disabled — no creation flow yet)
 *   - Recent Activity placeholder (no audit log subsystem yet)
 *   - System Settings (3 read-only placeholders per spec)
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
    branches,
    departmentsCount,
    onboardingActive,
    onboardingCompleted,
    userRows,
  ] = await Promise.all([
    prisma.users.count({ where: { status: "active" } }),
    fetchBranchCards(),
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
          branchCount: branches.length,
          departmentCount: departmentsCount,
          onboardingActive,
          onboardingCompleted,
        }}
        branches={branches}
        users={userRows}
      />
    </AppShell>
  );
}

/**
 * Per-branch stats: onboarding count (active profiles where the user's
 * active employment is at this branch) + coaches count (employments with
 * position containing "COACH" at this branch). Single trip — fetch all
 * employments with relations and aggregate in memory.
 */
async function fetchBranchCards(): Promise<BranchCardData[]> {
  const branches = await prisma.branch.findMany({
    orderBy: { branch_name: "asc" },
    select: {
      branch_id: true,
      branch_code: true,
      branch_name: true,
      location: true,
    },
  });

  // For onboarding counts per branch: get all active induction_profile records
  // (Sent / In Progress / Created), look up each user's active employment, group by branch.
  const activeProfiles = await prisma.induction_profile.findMany({
    where: {
      induction_type: "Onboarding",
      status: { in: ["Sent", "In Progress", "Created"] },
    },
    select: {
      user: {
        select: {
          employment: {
            where: { status: { in: ["active", "onboarding"] } },
            orderBy: { start_date: "desc" },
            take: 1,
            select: { branch_id: true },
          },
        },
      },
    },
  });
  const onboardingByBranch: Record<number, number> = {};
  for (const p of activeProfiles) {
    const branchId = p.user.employment[0]?.branch_id;
    if (branchId != null) {
      onboardingByBranch[branchId] = (onboardingByBranch[branchId] ?? 0) + 1;
    }
  }

  // Coaches per branch: active employments whose position contains "COACH".
  // Counts both PT COACH and FT COACH (case-insensitive match).
  const coachEmployments = await prisma.employment.findMany({
    where: {
      status: "active",
      position: { contains: "COACH", mode: "insensitive" },
    },
    select: { branch_id: true },
  });
  const coachesByBranch: Record<number, number> = {};
  for (const e of coachEmployments) {
    if (e.branch_id != null) {
      coachesByBranch[e.branch_id] = (coachesByBranch[e.branch_id] ?? 0) + 1;
    }
  }

  // Completed per branch: induction_profile status = Completed, same join pattern.
  const completedProfiles = await prisma.induction_profile.findMany({
    where: { induction_type: "Onboarding", status: "Completed" },
    select: {
      user: {
        select: {
          employment: {
            where: { status: { in: ["active", "onboarding"] } },
            orderBy: { start_date: "desc" },
            take: 1,
            select: { branch_id: true },
          },
        },
      },
    },
  });
  const completedByBranch: Record<number, number> = {};
  for (const p of completedProfiles) {
    const branchId = p.user.employment[0]?.branch_id;
    if (branchId != null) {
      completedByBranch[branchId] = (completedByBranch[branchId] ?? 0) + 1;
    }
  }

  type BranchRow = (typeof branches)[number];
  return branches.map((b: BranchRow) => ({
    id: b.branch_id,
    code: b.branch_code ?? "",
    name: b.branch_name,
    location: b.location ?? null,
    onboardingCount: onboardingByBranch[b.branch_id] ?? 0,
    coachesCount: coachesByBranch[b.branch_id] ?? 0,
    completedCount: completedByBranch[b.branch_id] ?? 0,
    isHQ: (b.branch_code ?? "").toUpperCase() === "HQ",
  }));
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
