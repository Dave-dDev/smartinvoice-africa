import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Real-time hook for customers with connection status tracking
 * @param {Function} setCustomers - State setter for customers
 * @returns {Object} Connection status and metrics
 */
export function useRealtimeCustomers(setCustomers) {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        (payload) => {
          console.log("🔄 Customer change detected:", payload.eventType, payload.new?.id || payload.old?.id);
          
          if (payload.eventType === "INSERT") {
            setCustomers((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCustomers((prev) =>
              prev.map((cust) => (cust.id === payload.new.id ? { ...cust, ...payload.new } : cust))
            );
          } else if (payload.eventType === "DELETE") {
            setCustomers((prev) => prev.filter((cust) => cust.id !== payload.old.id));
          }
          
          setLastUpdate(new Date());
          setUpdateCount((prev) => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log("📡 Customer subscription status:", status);
        setConnectionStatus(status);
      });

    return () => {
      console.log("🔌 Cleaning up customer subscription");
      supabase.removeChannel(channel);
    };
  }, [setCustomers]);

  return {
    connectionStatus,
    isConnected: connectionStatus === "SUBSCRIBED",
    lastUpdate,
    updateCount,
  };
}
