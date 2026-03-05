import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeInvoices(setInvoices) {
  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInvoices((prev) => [payload.new, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === payload.new.id ? payload.new : inv))
            );
          }
          if (payload.eventType === "DELETE") {
            setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [setInvoices]);
}
