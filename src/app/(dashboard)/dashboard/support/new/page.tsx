import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground font-heading">
        New Support Ticket
      </h1>
      <div className="mx-auto max-w-xl">
        <NewTicketForm />
      </div>
    </div>
  );
}
