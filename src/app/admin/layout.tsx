import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import type { ReactNode } from "react";

/**
 * Admin route-group layout — gates ALL /admin/* pages to admin / superadmin
 * roles ONLY. The individual page.tsx files then wrap their content in
 * <AdminShell> (different per page because each one has its own topbar title).
 *
 * This layout does NOT render any UI itself — only the auth gate. Keeps it
 * lightweight and lets each page decide its own topbar title via AdminShell.
 *
 * Non-admin users (staff, hr, hod, ceo, finance, etc.) get redirected to
 * /home rather than seeing a 403 — they don't belong here.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();
  if (roleType !== "admin" && roleType !== "superadmin") {
    redirect("/home");
  }

  return <>{children}</>;
}
