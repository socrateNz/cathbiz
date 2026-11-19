import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { PageHero } from "@/components/ui";
import { site, telHref } from "@/lib/site";

type Country = { code: string; name: string; phones: string[]; seat?: boolean };

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.hero" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tp = await getTranslations("presence");
  const others = (tp.raw("countries") as Country[]).filter((c) => !c.seat && c.phones.length);

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-purple-deep p-8 text-white md:p-10">
            <div className="bg-diamonds absolute inset-0" aria-hidden />
            <div className="relative">
              <h2 className="font-serif text-3xl font-semibold">{t("infoTitle")}</h2>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold-light">{t("address")}</p>
                    <p className="mt-1">{t("addressValue")}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold-light">{t("email")}</p>
                    <a href={`mailto:${site.email}`} className="mt-1 block hover:underline">{site.email}</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold-light">{t("phones")}</p>
                    {site.phones.map((p) => (
                      <a key={p} href={telHref(p)} className="mt-1 block hover:underline">{p}</a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-white/10 pt-6">
                <p className="text-xs uppercase tracking-wider text-gold-light">{t("countriesTitle")}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {others.map((c) => (
                    <li key={c.code} className="flex justify-between gap-4">
                      <span className="text-white/70">{c.name}</span>
                      <a href={telHref(c.phones[0])} className="hover:underline">{c.phones[0]}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-purple/5 md:p-10">
            <h2 className="mb-6 font-serif text-3xl font-semibold text-purple">{t("form.title")}</h2>
            <ContactForm />
          </div>
        </Reveal>
      </section>
    </>
  );
}
