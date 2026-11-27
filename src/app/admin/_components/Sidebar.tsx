"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logout } from "../actions";

const ICONS = {
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  applications: Inbox,
  messages: Mail,
  users: Users,
  account: UserCog,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

export default function Sidebar({ items, user }: { items: NavItem[]; user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className={`h-4.5 w-4.5 ${active ? "text-gold-light" : ""}`} />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-purple-deep">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 px-5 py-4">
      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
      <p className="text-xs text-white/50">{user.role}</p>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <a href="/fr" target="_blank" rel="noopener" className="flex items-center gap-1 text-white/60 hover:text-gold-light">
          <ExternalLink className="h-3.5 w-3.5" /> Voir le site
        </a>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1 text-white/60 hover:text-gold-light">
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
      <Image src="/images/logo-cbna.png" alt="" width={40} height={40} className="rounded-full ring-1 ring-gold" />
      <span className="leading-tight">
        <span className="block font-serif text-lg font-bold text-white">CBNA · RECA</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-gold-light">Back-office</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-purple-deep px-4 py-3 lg:hidden">
        <span className="font-serif text-lg font-bold text-white">CBNA · Back-office</span>
        <button type="button" onClick={() => setOpen(true)} className="p-1 text-white" aria-label="Ouvrir le menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex w-72 flex-col bg-purple-deep">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-white" aria-label="Fermer le menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
          <button type="button" className="flex-1 bg-black/40" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
        </div>
      )}

      {/* Barre latérale bureau */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-purple-deep lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
