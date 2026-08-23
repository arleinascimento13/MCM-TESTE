"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ResubmitButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResubmit() {
    setLoading(true);
    try {
      await fetch(`/api/time-entries/${entryId}/resubmit`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleResubmit} disabled={loading}>
      {loading ? "Reenviando..." : "Reenviar para aprovação"}
    </Button>
  );
}
