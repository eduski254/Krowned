"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";

export function MessageBusinessButton({
  businessId,
  isLoggedIn,
  isOwnBusiness,
  slug,
}: {
  businessId: string;
  isLoggedIn: boolean;
  isOwnBusiness: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isOwnBusiness) return null;

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/b/${slug}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to start conversation:", err);
        return;
      }

      const { conversationId } = await res.json();
      router.push(`/dashboard/messages/${conversationId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      Message
    </button>
  );
}
