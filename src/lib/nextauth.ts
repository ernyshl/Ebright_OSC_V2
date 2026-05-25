import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { titleCaseName } from "@/lib/text";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Username/Email", type: "text" },
        password: { label: "Password",       type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          include: {
            role: true,
            user_profile: true,
            employment: {
              where: { status: "active" },
              include: { branch: true },
              take: 1,
            },
          },
        });
        if (!user) return null;
        if (user.status !== "active") return null;
        if (!user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { last_login: new Date() },
        });

        const activeEmployment = user.employment[0];

        return {
          id:         user.user_id.toString(),
          email:      user.email,
          name:       titleCaseName(user.user_profile?.full_name) || null,
          role:       user.role.role_type,
          position:   activeEmployment?.position ?? null,
          branchName: activeEmployment?.branch?.branch_name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId     = (user as { id?: string }).id;
        token.role       = (user as { role?: string }).role;
        token.position   = (user as { position?: string | null }).position;
        token.branchName = (user as { branchName?: string | null }).branchName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: unknown }).id           = token.userId;
        (session.user as { role?: unknown }).role       = token.role;
        (session.user as { position?: unknown }).position = token.position;
        (session.user as { branchName?: unknown }).branchName = token.branchName;
      }
      return session;
    },
  },
  events: {
    /**
     * First-login detection for onboarding candidates.
     *
     * When a candidate logs in with the credentials HR generated for
     * them, this hook fires AFTER successful authentication. If they
     * have an induction_profile with status="Sent" and no existing
     * pending/accepted induction_request, we create the pending
     * request — which causes:
     *   - the count badge on Pending Induction Requests to tick up
     *   - the NotificationBell to alert HR/Admin
     *
     * Re-running this on subsequent logins is a no-op thanks to the
     * uq_induction_request_user_active unique constraint
     * (one active row per user where status <> 'completed').
     */
    async signIn(message) {
      const userIdStr = (message.user as { id?: string }).id;
      const userId = userIdStr ? Number.parseInt(userIdStr, 10) : NaN;
      if (!Number.isFinite(userId)) return;

      try {
        const profile = await prisma.induction_profile.findUnique({
          where: { user_id: userId },
          select: { id: true, status: true },
        });
        if (!profile || profile.status !== "Sent") return;

        const existingRequest = await prisma.induction_request.findFirst({
          where: { user_id: userId, status: { not: "completed" } },
          select: { id: true },
        });
        if (existingRequest) return;

        await prisma.induction_request.create({
          data: {
            user_id: userId,
            triggered_by_id: userId, // self-triggered by first login
            status: "pending",
          },
        });
      } catch (e) {
        // Don't block login if this fails — just log and move on.
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[nextauth] induction-request on first login failed:", msg);
      }
    },
  },
  // signIn: where unauthenticated users land. error: where NextAuth redirects
  // on internal auth errors instead of the default /api/auth/error page, which
  // can 404 if the catch-all handler is mid-restart or its internal page
  // renderer throws.
  pages:   { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};
