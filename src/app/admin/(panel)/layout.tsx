import { Suspense } from "react";
import { can, countryScope, requireUser, ROLE_LABELS } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { COUNTRY_LABELS, type JobCountry } from "@/lib/jobs";
import Sidebar, { type NavItem } from "../_components/Sidebar";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen lg:flex">
      <Suspense fallback={<aside className="hidden h-screen w-64 shrink-0 bg-purple-deep lg:block" />}>
        <SidebarLoader />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

async function SidebarLoader() {
  const user = await requireUser();
  const db = await getDb();
  const [newApplications, newMessages] = await Promise.all([
    can(user.role, "applications.view")
      ? db.collection("applications").countDocuments({ status: "received", ...countryScope(user) })
      : 0,
    can(user.role, "messages.view") ? db.collection("messages").countDocuments({ status: "new" }) : 0,
  ]);

  const items: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "Tableau de bord", icon: "dashboard", show: true },
    { href: "/admin/jobs", label: "Offres d'emploi", icon: "jobs", show: can(user.role, "jobs.manage") },
    {
      href: "/admin/applications",
      label: "Candidatures",
      icon: "applications",
      badge: newApplications,
      show: can(user.role, "applications.view"),
    },
    { href: "/admin/messages", label: "Messages", icon: "messages", badge: newMessages, show: can(user.role, "messages.view") },
    { href: "/admin/users", label: "Utilisateurs", icon: "users", show: can(user.role, "users.manage") },
    { href: "/admin/account", label: "Mon compte", icon: "account", show: true },
  ];

  const role =
    user.role === "section" && user.country
      ? `${ROLE_LABELS[user.role]} · ${COUNTRY_LABELS[user.country as JobCountry] ?? user.country}`
      : ROLE_LABELS[user.role];

  const visible: NavItem[] = items
    .filter((i) => i.show)
    .map((i) => ({ href: i.href, label: i.label, icon: i.icon, badge: i.badge }));
  return <Sidebar items={visible} user={{ name: user.name, role }} />;
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 w-64 rounded-lg bg-purple/10" />
      <div className="h-4 w-96 max-w-full rounded bg-purple/5" />
      <div className="mt-8 h-64 rounded-2xl bg-white" />
    </div>
  );
}
