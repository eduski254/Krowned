"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { NewBookingModal } from "./new-booking-modal";

interface Props {
  businessId: string;
  services: { id: string; name: string; duration_minutes: number; price_amount: number; currency: string }[];
  staffMembers: { id: string; display_name: string }[];
}

export function CalendarHeader({ businessId, services, staffMembers }: Props) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Calendar &amp; Bookings
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Booking</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {showModal && (
        <NewBookingModal
          businessId={businessId}
          services={services}
          staffMembers={staffMembers}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
