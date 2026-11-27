import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "../../../_components/forms";
import JobFormFields from "../../../_components/JobFormFields";
import { btn, PageTitle } from "../../../_components/ui";
import { saveJob } from "../../../actions";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default async function NewJobPage() {
  const user = await requireUser("jobs.manage");
  return (
    <>
      <PageTitle title="Nouvelle offre" subtitle="Les champs marqués * sont obligatoires." />
      <ActionForm action={saveJob} submitLabel="Enregistrer l'offre" submitClass={btn.gold} className="space-y-6">
        <JobFormFields user={user} />
      </ActionForm>
    </>
  );
}
