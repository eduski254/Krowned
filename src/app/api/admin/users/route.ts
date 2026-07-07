import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const patchSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["suspend", "unsuspend", "make_admin", "remove_admin"]),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Don't allow self-modification
  if (parsed.data.userId === user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (parsed.data.action) {
    case "suspend": {
      const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
        ban_duration: "876000h", // ~100 years
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "unsuspend": {
      const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
        ban_duration: "none",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "make_admin": {
      const { error } = await admin
        .from("profiles")
        .update({ platform_role: "super_admin" })
        .eq("id", parsed.data.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "remove_admin": {
      const { error } = await admin
        .from("profiles")
        .update({ platform_role: "user" })
        .eq("id", parsed.data.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = deleteSchema.safeParse({ userId: searchParams.get("userId") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.userId === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(parsed.data.userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
