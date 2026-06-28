"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200).trim(),
  message: z.string().min(10).max(5000).trim(),
  category: z.enum(["billing", "booking", "account", "technical", "feature_request", "other"]),
});

const replySchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1).max(5000).trim(),
});

const updateTicketSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

// ── User Actions ───────────────────────────────────────────────────

export async function createTicket(input: z.infer<typeof createTicketSchema>) {
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Create ticket
  const { data: ticket, error: ticketErr } = await admin
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
    })
    .select("id")
    .single();

  if (ticketErr || !ticket) return { error: "Failed to create ticket." };

  // Add first message
  const { error: msgErr } = await admin.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message: parsed.data.message,
    is_staff_reply: false,
  });

  if (msgErr) return { error: "Ticket created but failed to add message." };

  // Notify super admins
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin");

  if (admins && admins.length > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await admin.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        type: "support_ticket" as any,
        title: "New support ticket",
        body: `${profile?.full_name ?? "A user"}: ${parsed.data.subject}`,
        data: { ticket_id: ticket.id } as any,
      })),
    );
  }

  return { ticketId: ticket.id };
}

export async function replyToTicket(input: z.infer<typeof replySchema>) {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Check ticket access
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, user_id, status")
    .eq("id", parsed.data.ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found." };

  // Check if user is ticket owner or super admin
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.platform_role === "super_admin";
  if (ticket.user_id !== user.id && !isAdmin) return { error: "Access denied." };

  if (ticket.status === "closed") return { error: "This ticket is closed." };

  // Insert reply
  const { error: msgErr } = await admin.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message: parsed.data.message,
    is_staff_reply: isAdmin,
  });

  if (msgErr) return { error: "Failed to send reply." };

  // If admin replied, reopen if resolved, or set to in_progress if open
  if (isAdmin && ticket.status === "open") {
    await admin.from("support_tickets").update({ status: "in_progress" }).eq("id", ticket.id);
  }

  // Notify the other party
  const notifyUserId = isAdmin ? ticket.user_id : null;
  if (notifyUserId) {
    await admin.from("notifications").insert({
      user_id: notifyUserId,
      type: "support_reply" as any,
      title: "Reply on your support ticket",
      body: `${profile?.full_name ?? "Support"} replied to "${ticket.id}"`,
      data: { ticket_id: ticket.id } as any,
    });
  } else if (!isAdmin) {
    // User replied — notify admins
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("platform_role", "super_admin");

    if (admins && admins.length > 0) {
      await admin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          type: "support_reply" as any,
          title: "New reply on support ticket",
          body: `${profile?.full_name ?? "User"} replied`,
          data: { ticket_id: ticket.id } as any,
        })),
      );
    }
  }

  return { success: true };
}

export async function getUserTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tickets: [] };

  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, subject, category, priority, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return { tickets: tickets ?? [] };
}

export async function getTicketWithMessages(ticketId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, user_id, subject, category, priority, status, created_at, updated_at, assigned_to, profiles!user_id(full_name, email:avatar_url)")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found." };

  const isAdmin = profile?.platform_role === "super_admin";
  if (ticket.user_id !== user.id && !isAdmin) return { error: "Access denied." };

  const { data: messages } = await admin
    .from("support_ticket_messages")
    .select("id, sender_id, message, is_staff_reply, created_at, profiles!sender_id(full_name, avatar_url)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return { ticket, messages: messages ?? [], isAdmin };
}

// ── Admin Actions ──────────────────────────────────────────────────

export async function updateTicket(input: z.infer<typeof updateTicketSchema>) {
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") return { error: "Admin only." };

  const updates: Record<string, any> = {};
  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "closed") updates.closed_at = new Date().toISOString();
  }
  if (parsed.data.priority) updates.priority = parsed.data.priority;
  if (parsed.data.assignedTo !== undefined) updates.assigned_to = parsed.data.assignedTo;

  if (Object.keys(updates).length === 0) return { error: "Nothing to update." };

  const { error } = await admin
    .from("support_tickets")
    .update(updates)
    .eq("id", parsed.data.ticketId);

  if (error) return { error: "Failed to update ticket." };

  // Notify ticket owner of status change
  if (parsed.data.status) {
    const { data: ticket } = await admin
      .from("support_tickets")
      .select("user_id, subject")
      .eq("id", parsed.data.ticketId)
      .single();

    if (ticket) {
      await admin.from("notifications").insert({
        user_id: ticket.user_id,
        type: "support_update" as any,
        title: `Ticket ${parsed.data.status}`,
        body: `Your ticket "${ticket.subject}" has been marked as ${parsed.data.status}.`,
        data: { ticket_id: parsed.data.ticketId } as any,
      });
    }
  }

  return { success: true };
}

export async function getAllTickets(statusFilter?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tickets: [] };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "super_admin") return { tickets: [] };

  let query = admin
    .from("support_tickets")
    .select("id, subject, category, priority, status, created_at, updated_at, user_id, assigned_to, profiles!user_id(full_name)")
    .order("updated_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: tickets } = await query;
  return { tickets: tickets ?? [] };
}
