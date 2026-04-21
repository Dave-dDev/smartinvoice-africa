import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Real-time hook for expenses with connection status tracking
 * @param {Function} setExpenses - State setter for expenses
 * @returns {Object} Connection status and metrics
 */
export function useRealtimeExpenses(setExpenses) {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload) => {
          console.log("🔄 Expense change detected:", payload.eventType, payload.new?.id || payload.old?.id);
          
          if (payload.eventType === "INSERT") {
            setExpenses((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setExpenses((prev) =>
              prev.map((exp) => (exp.id === payload.new.id ? { ...exp, ...payload.new } : exp))
            );
          } else if (payload.eventType === "DELETE") {
            setExpenses((prev) => prev.filter((exp) => exp.id !== payload.old.id));
          }
          
          setLastUpdate(new Date());
          setUpdateCount((prev) => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log("📡 Expense subscription status:", status);
        setConnectionStatus(status);
      });

    return () => {
      console.log("🔌 Cleaning up expense subscription");
      supabase.removeChannel(channel);
    };
  }, [setExpenses]);

  return {
    connectionStatus,
    isConnected: connectionStatus === "SUBSCRIBED",
    lastUpdate,
    updateCount,
  };
}
