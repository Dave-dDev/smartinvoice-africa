import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Generic real-time subscription hook for any table
 * @param {string} tableName - Name of the Supabase table to subscribe to
 * @param {Function} setState - State setter function
 * @param {string} idField - Name of the ID field (default: 'id')
 * @returns {Object} Connection status and metrics
 */
export function useRealtimeData(tableName, setState, idField = "id") {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload) => {
          console.log(`🔄 ${tableName} change detected:`, payload.eventType, payload.new?.[idField] || payload.old?.[idField]);
          
          if (payload.eventType === "INSERT") {
            setState((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setState((prev) =>
              prev.map((item) => (item[idField] === payload.new[idField] ? { ...item, ...payload.new } : item))
            );
          } else if (payload.eventType === "DELETE") {
            setState((prev) => prev.filter((item) => item[idField] !== payload.old[idField]));
          }
          
          setLastUpdate(new Date());
          setUpdateCount((prev) => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log(`📡 ${tableName} subscription status:`, status);
        setConnectionStatus(status);
      });

    return () => {
      console.log(`🔌 Cleaning up ${tableName} subscription`);
      supabase.removeChannel(channel);
    };
  }, [tableName, setState, idField]);

  return {
    connectionStatus,
    isConnected: connectionStatus === "SUBSCRIBED",
    lastUpdate,
    updateCount,
  };
}

/**
 * Manually subscribe to a table with custom handling
 * @param {string} tableName - Name of the table
 * @param {Function} handler - Custom handler function for changes
 * @returns {Object} Subscription control methods
 */
export function subscribeToTable(tableName, handler) {
  const channel = supabase
    .channel(`${tableName}-manual-changes`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      handler
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      console.log(`🔌 Unsubscribed from ${tableName}`);
      supabase.removeChannel(channel);
    },
  };
}
