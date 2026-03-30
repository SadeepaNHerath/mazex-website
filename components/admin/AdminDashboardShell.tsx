"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  Handshake,
  LayoutTemplate,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { logoutAdminAction } from "@/app/admin/actions";

type AdminDashboardShellProps = {
  children?: React.ReactNode;
};

const navigationItems = [
  {
    href: "/admin",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/admin/resources",
    label: "Resources",
    icon: BookOpenText,
  },
  {
    href: "/admin/form-builder",
    label: "Form Builder",
    icon: LayoutTemplate,
  },
  {
    href: "/admin/registrations",
    label: "Registrations",
    icon: ClipboardList,
  },
  {
    href: "/admin/sponsors",
    label: "Sponsors",
    icon: Handshake,
  },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AdminDashboardShell({
  children,
}: AdminDashboardShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="admin-shell min-h-screen" suppressHydrationWarning>
      <div className="flex min-h-screen">
        <div
          className={cn(
            "fixed inset-0 z-30 lg:hidden",
            mobileSidebarOpen ? "block" : "hidden",
          )}
        >
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="h-full w-full bg-[#020617]/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>

        <aside
          className={cn(
            "admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[18.5rem] flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "lg:w-24" : "lg:w-[18.5rem]",
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--admin-sidebar-border)] px-5 py-5">
            <div className={cn("min-w-0", sidebarCollapsed && "lg:hidden")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--admin-muted)]">
                MazeX
              </p>
              <h1 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
                Admin
              </h1>
            </div>

            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="admin-icon-button hidden h-11 w-11 lg:inline-flex"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <PanelLeftClose className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          <div className="flex-1 px-4 py-5">
            <p
              className={cn(
                "px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]",
                sidebarCollapsed && "lg:hidden",
              )}
            >
              Pages
            </p>

            <nav className="mt-3 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="admin-nav-item w-full"
                    data-active={isActive ? "true" : "false"}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn(sidebarCollapsed && "lg:hidden")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[var(--admin-sidebar-border)] px-4 py-4">
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className={cn(
                  "admin-button-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
                  sidebarCollapsed && "lg:px-0",
                )}
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span className={cn(sidebarCollapsed && "lg:hidden")}>
                  Sign out
                </span>
              </button>
            </form>
          </div>
        </aside>

        <div className="admin-main flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[var(--admin-border)] bg-[var(--admin-header)] px-4 py-4 lg:hidden">
            <button
              type="button"
              aria-label="Open sidebar"
              className="admin-icon-button inline-flex h-11 w-11"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
