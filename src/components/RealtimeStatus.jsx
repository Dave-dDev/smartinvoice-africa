import { useState, useEffect } from "react";

/**
 * Real-time connection status indicator
 * Shows current connection state with visual feedback
 */
export function RealtimeStatus({ connectionStatus, lastUpdate, updateCount, showDetails = false }) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now - lastUpdate) / 1000);
      
      if (diff < 5) setTimeAgo("just now");
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      else setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "SUBSCRIBED":
        return {
          color: "#1A7A50",
          bg: "rgba(26, 122, 80, 0.1)",
          icon: "🟢",
          text: "Live",
        };
      case "CHANNEL_UNSUBSCRIBED":
      case "connecting":
        return {
          color: "#E8A020",
          bg: "rgba(232, 160, 32, 0.1)",
          icon: "🟡",
          text: "Connecting",
        };
      default:
        return {
          color: "#C4522A",
          bg: "rgba(196, 82, 42, 0.1)",
          icon: "🔴",
          text: "Disconnected",
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 20,
        background: status.bg,
        fontSize: 12,
        fontFamily: "DM Sans, sans-serif",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      title={showDetails ? undefined : `Status: ${connectionStatus}\nUpdates: ${updateCount}\nLast: ${timeAgo}`}
    >
      <span style={{ fontSize: 14 }}>{status.icon}</span>
      <span style={{ color: status.color, fontWeight: 600 }}>{status.text}</span>
      
      {showDetails && (
        <>
          <span style={{ width: 1, height: 14, background: "rgba(0,0,0,0.1)" }} />
          <span style={{ color: "#6B6455", fontSize: 11 }}>
            {updateCount} update{updateCount !== 1 ? "s" : ""} • {timeAgo}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Simplified status badge for compact displays
 */
export function RealtimeBadge({ isConnected }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: isConnected ? "#1A7A50" : "#E8A020",
        display: "inline-block",
        marginLeft: 6,
        animation: isConnected ? "pulse 2s infinite" : "none",
      }}
    />
  );
}
