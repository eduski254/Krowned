"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { X, Search, AlertTriangle, CheckCircle, Plus, User } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { createManualBooking, type ManualBookingResult } from "@/lib/booking/manual-booking-action";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number;
  currency: string;
}

interface Staff {
  id: string;
  display_name: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Props {
  businessId: string;
  services: Service[];
  staffMembers: Staff[];
  onClose: () => void;
  onCreated: () => void;
}

type Step = "details" | "confirm" | "done";

export function NewBookingModal({ businessId, services, staffMembers, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("details");

  // Form state
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientNote, setClientNote] = useState("");

  // Contact state
  const [contactMode, setContactMode] = useState<"search" | "new">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ManualBookingResult["conflict"] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Search contacts as user types
  const searchContacts = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/contacts?businessId=${businessId}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.contacts ?? []);
      }
    } catch { /* silent */ }
    setSearching(false);
  }, [businessId]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => searchContacts(searchQuery), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, searchContacts]);

  // Load all contacts initially
  useEffect(() => {
    fetch(`/api/contacts?businessId=${businessId}&q=`)
      .then((r) => r.json())
      .then((d) => setSearchResults(d.contacts ?? []))
      .catch(() => {});
  }, [businessId]);

  const selectedService = services.find((s) => s.id === serviceId);

  const canSubmit = () => {
    if (!serviceId || !staffId || !date || !time) return false;
    if (contactMode === "search" && !selectedContact) return false;
    if (contactMode === "new") {
      if (!newName.trim()) return false;
      if (!newPhone.trim() && !newEmail.trim()) return false;
    }
    return true;
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const handleSubmit = (override = false) => {
    setError(null);
    if (!override) setConflict(null);

    const slotStart = new Date(`${date}T${time}:00`).toISOString();
    const contact = contactMode === "search" && selectedContact
      ? { type: "existing" as const, contactId: selectedContact.id }
      : {
          type: "new" as const,
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          email: newEmail.trim() || undefined,
        };

    startTransition(async () => {
      const result = await createManualBooking({
        businessId,
        serviceId,
        staffId,
        slotStart,
        contact,
        overrideConflict: override,
        clientNote: clientNote.trim(),
      });

      if (result.conflict && !override) {
        setConflict(result.conflict);
        return;
      }

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      setBookingId(result.bookingId ?? null);
      setStep("done");
      onCreated();
    });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4 rounded-t-xl">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {step === "done" ? "Booking Created" : "New Booking"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {step === "done" ? (
            <DoneState bookingId={bookingId} onClose={onClose} />
          ) : (
            <>
              {/* Service */}
              <fieldset>
                <label className="block text-sm font-medium text-foreground mb-1.5">Service</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes}min - {formatPrice(s.price_amount, s.currency)})
                    </option>
                  ))}
                </select>
              </fieldset>

              {/* Staff */}
              <fieldset>
                <label className="block text-sm font-medium text-foreground mb-1.5">Staff member</label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select staff</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </fieldset>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <fieldset>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </fieldset>
                <fieldset>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    step="1800"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </fieldset>
              </div>

              {/* Client */}
              <fieldset>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Client</label>
                  <button
                    type="button"
                    onClick={() => {
                      setContactMode(contactMode === "search" ? "new" : "search");
                      setSelectedContact(null);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {contactMode === "search" ? (
                      <><Plus className="h-3 w-3" /> New client</>
                    ) : (
                      <><Search className="h-3 w-3" /> Search existing</>
                    )}
                  </button>
                </div>

                {contactMode === "search" ? (
                  <div>
                    {selectedContact ? (
                      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {selectedContact.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedContact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[selectedContact.phone, selectedContact.email].filter(Boolean).join(" | ")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedContact(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, phone, or email..."
                            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {searching && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
                        </div>
                        {searchResults.length > 0 && (
                          <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-border bg-popover">
                            {searchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedContact(c);
                                  setSearchQuery("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                              >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                                  {c.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">{c.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {[c.phone, c.email].filter(Boolean).join(" | ")}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchQuery.length > 0 && searchResults.length === 0 && !searching && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            No contacts found.{" "}
                            <button type="button" onClick={() => { setContactMode("new"); setNewName(searchQuery); }} className="text-primary hover:underline">
                              Create new
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-lg border border-border p-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Client name"
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+254..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    {!newPhone.trim() && !newEmail.trim() && newName.trim() && (
                      <p className="text-xs text-warning">Provide at least one: phone or email</p>
                    )}
                  </div>
                )}
              </fieldset>

              {/* Note */}
              <fieldset>
                <label className="block text-sm font-medium text-foreground mb-1.5">Note (optional)</label>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Any notes about this booking..."
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </fieldset>

              {/* Conflict warning */}
              {conflict && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{conflict.message}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={isPending}
                        className="rounded-lg bg-warning/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-warning/20 transition-colors"
                      >
                        {isPending ? <Spinner className="h-3 w-3" /> : "Override & Book Anyway"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConflict(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Summary */}
              {selectedService && (
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    {selectedService.name} - {formatPrice(selectedService.price_amount, selectedService.currency)}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedService.duration_minutes} min | Pay at store | Source: manual
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isPending || !canSubmit()}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Spinner className="h-4 w-4" /> : null}
                  Create Booking
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DoneState({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-4">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-lg font-heading font-bold text-foreground mb-1">Booking confirmed</h3>
      {bookingId && (
        <p className="text-sm text-muted-foreground mb-1">
          Ref: ZW-{bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()}
        </p>
      )}
      <p className="text-sm text-muted-foreground mb-6">
        The booking has been added to the calendar. If the client has an email, a confirmation was sent.
      </p>
      <button
        onClick={onClose}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Done
      </button>
    </div>
  );
}
