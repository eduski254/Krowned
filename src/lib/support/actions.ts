"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail } from "@/lib/email/resend";
import {
  newSupportTicketEmail,
  supportTicketReplyEmail,
  supportTicketStatusEmail,
} from "@/lib/email/templates";
import { createNotification, createNotificationBulk } from "@/lib/notifications";

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

    await createNotificationBulk(
      admins.map((a) => a.id),
      {
        type: "support_ticket",
        title: "New support ticket",
        body: `${profile?.full_name ?? "A user"}: ${parsed.data.subject}`,
        href: `/dashboard/admin/support/${ticket.id}`,
        meta: { ticket_id: ticket.id },
      },
    );

    // Email admins (fire-and-forget)
    for (const a of admins) {
      const { data: { user: adminUser } } = await admin.auth.admin.getUserById(a.id);
      if (!adminUser?.email) continue;
      const { data: ap } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", a.id)
        .single();
      const email = newSupportTicketEmail({
        adminName: ap?.full_name ?? "Admin",
        userName: profile?.full_name ?? "A user",
        subject: parsed.data.subject,
        category: parsed.data.category,
        ticketId: ticket.id,
        message: parsed.data.message,
      });
      sendEmail({ to: adminUser.email, ...email });
    }
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

  // Fetch ticket subject for email
  const { data: ticketDetail } = await admin
    .from("support_tickets")
    .select("subject")
    .eq("id", ticket.id)
    .single();

  // Notify the other party
  const notifyUserId = isAdmin ? ticket.user_id : null;
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      type: "support_reply",
      title: "Reply on your support ticket",
      body: `${profile?.full_name ?? "Support"} replied to your ticket`,
      href: `/dashboard/support/${ticket.id}`,
      meta: { ticket_id: ticket.id },
    });

    // Email the ticket owner
    const { data: { user: ownerUser } } = await admin.auth.admin.getUserById(notifyUserId);
    if (ownerUser?.email) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", notifyUserId)
        .single();
      const email = supportTicketReplyEmail({
        recipientName: ownerProfile?.full_name ?? "there",
        senderName: profile?.full_name ?? "Support Team",
        ticketSubject: ticketDetail?.subject ?? "Support ticket",
        ticketId: ticket.id,
        message: parsed.data.message,
        isStaffReply: true,
      });
      sendEmail({ to: ownerUser.email, ...email });
    }
  } else if (!isAdmin) {
    // User replied — notify admins
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("platform_role", "super_admin");

    if (admins && admins.length > 0) {
      await createNotificationBulk(
        admins.map((a) => a.id),
        {
          type: "support_reply",
          title: "New reply on support ticket",
          body: `${profile?.full_name ?? "A user"} replied`,
          href: `/dashboard/admin/support/${ticket.id}`,
          meta: { ticket_id: ticket.id },
        },
      );

      // Email admins
      for (const a of admins) {
        const { data: { user: adminUser } } = await admin.auth.admin.getUserById(a.id);
        if (!adminUser?.email) continue;
        const { data: ap } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", a.id)
          .single();
        const email = supportTicketReplyEmail({
          recipientName: ap?.full_name ?? "Admin",
          senderName: profile?.full_name ?? "A user",
          ticketSubject: ticketDetail?.subject ?? "Support ticket",
          ticketId: ticket.id,
          message: parsed.data.message,
          isStaffReply: false,
        });
        sendEmail({ to: adminUser.email, ...email });
      }
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
      await createNotification({
        userId: ticket.user_id,
        type: "support_update",
        title: `Ticket ${parsed.data.status}`,
        body: `Your ticket "${ticket.subject}" has been marked as ${parsed.data.status}.`,
        href: `/dashboard/support/${parsed.data.ticketId}`,
        meta: { ticket_id: parsed.data.ticketId },
      });

      // Email the ticket owner
      const { data: { user: ticketOwner } } = await admin.auth.admin.getUserById(ticket.user_id);
      if (ticketOwner?.email) {
        const { data: ownerProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", ticket.user_id)
          .single();
        const email = supportTicketStatusEmail({
          userName: ownerProfile?.full_name ?? "there",
          ticketSubject: ticket.subject,
          ticketId: parsed.data.ticketId,
          newStatus: parsed.data.status,
        });
        sendEmail({ to: ticketOwner.email, ...email });
      }
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
