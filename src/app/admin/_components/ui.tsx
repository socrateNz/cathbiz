import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass =
  "mt-1 w-full rounded-lg border border-purple/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
export const labelClass = "block text-sm font-medium text-ink";
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-soft disabled:opacity-60",
  gold: "inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-purple-deep transition hover:bg-gold-light disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-purple/15 bg-white px-4 py-2.5 text-sm font-medium text-purple transition hover:bg-purple/5",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50",
};

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-purple md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple/5 ${className}`}>{children}</div>;
}

const tones = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green/10 text-green",
  gold: "bg-gold/15 text-[#8a6416]",
  purple: "bg-purple/10 text-purple",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
};
export type Tone = keyof typeof tones;

export const APP_STATUS_TONE: Record<string, Tone> = {
  received: "gold",
  shortlisted: "blue",
  interview: "purple",
  hired: "green",
  rejected: "gray",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-purple/20 bg-white/60 p-12 text-center">
      <p className="font-serif text-2xl font-semibold text-purple">{title}</p>
      {text && <p className="mt-2 text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "green", children }: { tone?: "green" | "red" | "gold"; children: ReactNode }) {
  const cls = {
    green: "bg-green/10 text-green-deep",
    red: "bg-red-50 text-red-800",
    gold: "bg-gold/15 text-[#7a5812]",
  }[tone];
  return <p className={`mb-6 rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

export function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        active ? "bg-purple text-white" : "bg-white text-purple ring-1 ring-purple/15 hover:bg-purple/5"
      }`}
    >
      {children}
    </Link>
  );
}

/** Date courte en français, fuseau d'Afrique centrale */
export function fmtDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Africa/Douala",
  }).format(new Date(d));
}
