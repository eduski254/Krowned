"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  FileText,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  business_name: string | null;
  phone: string | null;
  source: string | null;
  tags: string[];
  city: string | null;
  stage: string;
  nurture_status: string;
  nurture_step: number;
  nurture_started_at: string | null;
  nurture_next_at: string | null;
  last_contacted_at: string | null;
  converted_user_id: string | null;
  converted_business_id: string | null;
  converted_at: string | null;
  converted_step: number | null;
  notes: string | null;
  source_captured_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadEmail {
  id: string;
  step: number;
  subject: string;
  status: string;
  error: string | null;
  resend_id: string | null;
  sent_at: string;
}

const STAGE_OPTIONS = ["new", "contacted", "qualified", "converted"];
const STATUS_OPTIONS = ["active", "paused", "unsubscribed", "completed", "converted", "bounced"];

export function LeadDetail({
  lead,
  emails,
}: {
  lead: Lead;
  emails: LeadEmail[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editName, setEditName] = useState(lead.name ?? "");
  const [editBusiness, setEditBusiness] = useState(lead.business_name ?? "");
  const [editPhone, setEditPhone] = useState(lead.phone ?? "");
  const [editCity, setEditCity] = useState(lead.city ?? "");
  const [editTags, setEditTags] = useState((lead.tags ?? []).join(", "));
  const [editNotes, setEditNotes] = useState(lead.notes ?? "");
  const [editStage, setEditStage] = useState(lead.stage);
  const [saved, setSaved] = useState(false);

  const save = async (updates: Record<string, unknown>) => {
    setPending(true);
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, ...updates }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleSaveContact = () => {
    save({
      name: editName || null,
      business_name: editBusiness || null,
      phone: editPhone || null,
      city: editCity || null,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: editNotes || null,
      stage: editStage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/leads"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground font-heading">
            {lead.name || lead.email || "Lead"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Added {new Date(lead.created_at).toLocaleDateString()} &middot;{" "}
            Source: {lead.source ?? "unknown"}
          </p>
        </div>
        {saved && (
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            Saved
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Contact info (editable) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Contact Information
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <input
                  value={lead.email ?? ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Business Name
                </label>
                <input
                  value={editBusiness}
                  onChange={(e) => setEditBusiness(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> City
                </label>
                <input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" /> Tags (comma-separated)
                </label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Stage</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  className="ml-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1" />
              <button
                onClick={handleSaveContact}
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Email Timeline */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Email Timeline
            </h2>
            {emails.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No emails sent yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {emails.map((em) => (
                  <div
                    key={em.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="mt-0.5">
                      {em.status === "sent" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Step {em.step + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(em.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {em.subject}
                      </p>
                      {em.error && (
                        <p className="mt-1 text-xs text-destructive">
                          {em.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Nurture panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Nurture Status
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={lead.nurture_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Step</span>
                <span className="text-sm font-medium text-foreground">
                  {lead.nurture_step} / 10
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(lead.nurture_step / 10) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="text-sm text-foreground">
                  {lead.nurture_started_at
                    ? new Date(lead.nurture_started_at).toLocaleDateString()
                    : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next send</span>
                <span className="text-sm text-foreground">
                  {lead.nurture_next_at
                    ? new Date(lead.nurture_next_at).toLocaleDateString()
                    : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last contacted
                </span>
                <span className="text-sm text-foreground">
                  {lead.last_contacted_at
                    ? new Date(lead.last_contacted_at).toLocaleDateString()
                    : "\u2014"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              {lead.nurture_status === "active" && (
                <button
                  onClick={() => save({ nurture_status: "paused" })}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" /> Pause Nurture
                </button>
              )}
              {lead.nurture_status === "paused" && (
                <button
                  onClick={() => save({ nurture_status: "active" })}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Resume Nurture
                </button>
              )}
              {lead.stage !== "converted" && (
                <button
                  onClick={() =>
                    save({
                      stage: "converted",
                      nurture_status: "converted",
                      converted_at: new Date().toISOString(),
                      converted_step: lead.nurture_step,
                    })
                  }
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success hover:bg-success/20 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Mark Converted
                </button>
              )}
              {lead.nurture_status !== "unsubscribed" && (
                <button
                  onClick={() => save({ nurture_status: "unsubscribed" })}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" /> Unsubscribe
                </button>
              )}
            </div>
          </div>

          {/* Conversion info */}
          {lead.converted_at && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5">
              <h3 className="text-sm font-semibold text-success">Converted</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  On {new Date(lead.converted_at).toLocaleDateString()} at step{" "}
                  {(lead.converted_step ?? 0) + 1}
                </p>
                {lead.converted_user_id && (
                  <p className="text-muted-foreground">
                    User: {lead.converted_user_id.slice(0, 8)}...
                  </p>
                )}
                {lead.converted_business_id && (
                  <p className="text-muted-foreground">
                    Business: {lead.converted_business_id.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    completed: "bg-primary/10 text-primary",
    unsubscribed: "bg-muted text-muted-foreground",
    bounced: "bg-destructive/10 text-destructive",
    converted: "bg-success/10 text-success",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
