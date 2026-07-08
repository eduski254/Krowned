import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewsList, { type ReviewItem } from "./reviews-list";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, status, created_at, businesses(name), clients:client_id(full_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const serialized: ReviewItem[] = (reviews ?? []).map((r) => {
    const business = r.businesses as unknown as { name: string } | null;
    const client = r.clients as unknown as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;

    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      created_at: r.created_at,
      business_name: business?.name ?? null,
      client_name: client?.full_name ?? null,
      client_avatar_url: client?.avatar_url ?? null,
    };
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Reviews</h1>
      <ReviewsList reviews={serialized} />
    </div>
  );
}
