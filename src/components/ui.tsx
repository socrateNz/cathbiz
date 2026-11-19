import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] ${
        light ? "text-gold-light" : "text-green"
      }`}
    >
      <span className="inline-block h-2 w-2 rotate-45 bg-gold" aria-hidden />
      {children}
    </p>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  intro,
  light,
  center,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? "mx-auto text-center [&>p:first-child]:justify-center" : ""}`}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <h2
        className={`font-serif text-4xl font-semibold leading-tight md:text-5xl ${
          light ? "text-white" : "text-purple"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-muted"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "gold" | "outline" | "purple" | "outlineDark";
};

const variants = {
  gold: "bg-gold text-purple-deep hover:bg-gold-light",
  purple: "bg-purple text-white hover:bg-purple-soft",
  outline: "border border-white/40 text-white hover:border-gold-light hover:text-gold-light",
  outlineDark: "border border-purple/30 text-purple hover:border-purple hover:bg-purple hover:text-white",
};

export function Button({ href, children, variant = "gold" }: ButtonProps) {
  const cls = `inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${variants[variant]}`;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Bandeau de citation biblique placé entre deux sections */
export function QuoteBanner({
  text,
  reference,
  tone = "light",
}: {
  text: string;
  reference: string;
  tone?: "light" | "dark" | "green";
}) {
  const tones = {
    light: "bg-white text-purple",
    dark: "bg-purple-deep text-white",
    green: "bg-green text-white",
  };
  return (
    <section className={`relative overflow-hidden ${tones[tone]}`}>
      {tone !== "light" && <div className="bg-diamonds absolute inset-0 opacity-60" aria-hidden />}
      <figure className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
        <div className="mx-auto mb-8 flex items-center justify-center gap-4" aria-hidden>
          <span className="h-px w-16 bg-gold" />
          <span className="h-2.5 w-2.5 rotate-45 bg-gold" />
          <span className="h-px w-16 bg-gold" />
        </div>
        <blockquote className="font-script font-semibold text-4xl leading-snug md:text-6xl">
          «&nbsp;{text}&nbsp;»
        </blockquote>
        <figcaption
          className={`mt-6 text-xs font-semibold uppercase tracking-[0.3em] ${
            tone === "light" ? "text-green" : "text-gold-light"
          }`}
        >
          {reference}
        </figcaption>
      </figure>
    </section>
  );
}

export function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-purple-deep text-white">
      <div className="bg-diamonds absolute inset-0" aria-hidden />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-soft/40 blur-3xl" aria-hidden />
      <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-green/25 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <h1 className="font-serif text-5xl font-semibold md:text-6xl">{title}</h1>
        <div className="mt-5 h-px w-24 bg-gold" />
        <p className="mt-5 max-w-2xl text-lg text-white/80">{subtitle}</p>
      </div>
    </section>
  );
}

export function JoinBanner({
  title,
  text,
  cta,
  ctaContact,
}: {
  title: string;
  text: string;
  cta: string;
  ctaContact: string;
}) {
  return (
    <section className="bg-gold">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl font-semibold text-purple-deep md:text-4xl">{title}</h2>
          <p className="mt-3 text-purple-deep/80">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/membership" variant="purple">
            {cta} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/contact" variant="outlineDark">
            {ctaContact}
          </Button>
        </div>
      </div>
    </section>
  );
}
