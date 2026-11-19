import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-32 text-center">
      <p className="font-serif text-8xl font-bold text-gold">404</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-purple">{t("title")}</h1>
      <p className="mt-3 text-muted">{t("text")}</p>
      <div className="mt-8">
        <Button href="/" variant="purple">{t("back")}</Button>
      </div>
    </section>
  );
}
