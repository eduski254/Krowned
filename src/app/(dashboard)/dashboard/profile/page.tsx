import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone, country, bio")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">
        My Profile
      </h1>
      <div className="max-w-xl rounded-xl border border-border bg-card p-6">
        <ProfileForm
          profile={{
            full_name: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            country: profile?.country ?? "",
            bio: profile?.bio ?? "",
            avatar_url: profile?.avatar_url ?? "",
          }}
        />
      </div>
    </div>
  );
}
