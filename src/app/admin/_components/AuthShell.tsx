import Image from "next/image";
import type { ReactNode } from "react";

/** Mise en page des écrans de connexion et de configuration */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-purple-deep px-4 py-12">
      <div className="bg-diamonds absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/images/logo-cbna.png" alt="Logo CBNA" width={72} height={72} className="rounded-full ring-1 ring-gold" />
          <h1 className="mt-4 font-serif text-3xl font-semibold text-purple">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
