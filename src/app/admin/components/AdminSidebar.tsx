"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Props {
  /** Active candidate count for the Onboarding badge. */
  onboardingCount?: number;
  /** Footer user info. */
  userName?: string | null;
  userRoleLabel?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Admin Console sidebar — dark #111 style per mockup spec.
 *
 * Currently only the Onboarding item is wired to a real route. The other
 * items render as disabled "Soon" placeholders so the visual structure
 * matches the spec without breaking on missing routes. Each placeholder
 * becomes a working link as its respective admin page is built in
 * subsequent PRs.
 */
export function AdminSidebar({ onboardingCount, userName, userRoleLabel = "Administrator" }: Props) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      label: "Management",
      items: [
        { href: "#", label: "Overview", icon: LayoutDashboard, disabled: true },
        { href: "/admin/onboarding", label: "Onboarding", icon: UserPlus },
        { href: "#", label: "Branches", icon: Building2, disabled: true },
        { href: "#", label: "Users", icon: Users, disabled: true },
        { href: "#", label: "Departments", icon: ClipboardList, disabled: true },
      ],
    },
    {
      label: "System",
      items: [
        { href: "#", label: "Reports", icon: BarChart3, disabled: true },
        { href: "#", label: "Audit Log", icon: FileText, disabled: true },
        { href: "#", label: "Settings", icon: Settings, disabled: true },
      ],
    },
  ];

  const isActive = (item: NavItem): boolean =>
    !item.disabled && pathname === item.href;

  const initials = userName
    ? userName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <aside
      className="hidden md:flex md:flex-col w-56 shrink-0"
      style={{ background: "#111", color: "#888" }}
    >
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#1e1e1e" }}>
        <div className="text-base font-bold tracking-tight text-white">
          e<span style={{ color: "#2563EB" }}>Bright</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#555" }}>
          Admin Console
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[1px]"
              style={{ color: "#444" }}
            >
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                const showBadge =
                  item.label === "Onboarding" &&
                  typeof onboardingCount === "number" &&
                  onboardingCount > 0;
                const baseClasses =
                  "group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors";
                const className = item.disabled
                  ? `${baseClasses} cursor-not-allowed`
                  : active
                    ? `${baseClasses} text-white`
                    : `${baseClasses} hover:bg-[#1a1a1a] hover:text-white`;
                const style = item.disabled
                  ? { color: "#444" }
                  : active
                    ? { background: "#2563EB", color: "#fff" }
                    : { color: "#888" };
                const content = (
                  <>
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span
                        className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={
                          active
                            ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                            : { background: "#333", color: "#aaa" }
                        }
                      >
                        {onboardingCount}
                      </span>
                    )}
                    {item.disabled && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: "#555" }}
                      >
                        Soon
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.disabled ? (
                      <div
                        className={className}
                        style={style}
                        aria-disabled="true"
                        tabIndex={-1}
                        title="Coming soon"
                      >
                        {content}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={className}
                        style={style}
                        aria-current={active ? "page" : undefined}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: "#1a1a1a" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#7C3AED" }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: "#ccc" }}>
              {userName ?? "System Admin"}
            </p>
            <p className="text-[10px]" style={{ color: "#555" }}>
              {userRoleLabel}
            </p>
          </div>
          <Link
            href="/dashboards/hrms"
            title="Exit Admin Console"
            className="text-[10px] font-semibold p-1 rounded hover:bg-[#1a1a1a]"
            style={{ color: "#666" }}
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
