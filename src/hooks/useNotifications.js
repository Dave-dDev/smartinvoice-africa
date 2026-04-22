/**
 * SmartInvoice Africa — useNotifications
 * Derives alert objects from invoices: overdue, due-soon, paid.
 */

import { useMemo } from "react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function useNotifications(invoices = []) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];

    invoices.forEach((inv) => {
      const dueRaw = inv.due_date || inv.due;
      if (!dueRaw) return;

      const due = new Date(dueRaw);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / MS_PER_DAY);

      const name = inv.customer_name || inv.client || "Unknown";
      const id = inv.invoice_number || inv.id;
      const amount = inv.total || inv.amount || 0;

      if (inv.status === "overdue" || (inv.status !== "paid" && diffDays < 0)) {
        notifications.push({
          id: `overdue-${inv.id}`,
          type: "overdue",
          priority: 1,
          icon: "⏰",
          title: `${name} — payment overdue`,
          subtitle: `${id} · ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`,
          amount,
          invoiceId: inv.id,
          daysOverdue: Math.abs(diffDays),
        });
      } else if (inv.status !== "paid" && diffDays >= 0 && diffDays <= 7) {
        notifications.push({
          id: `due-soon-${inv.id}`,
          type: "due-soon",
          priority: 2,
          icon: "📅",
          title: `${name} — payment due soon`,
          subtitle: `${id} · Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
          amount,
          invoiceId: inv.id,
          daysRemaining: diffDays,
        });
      } else if (inv.status === "paid") {
        const createdAt = inv.updated_at || inv.created_at;
        if (createdAt) {
          const updatedDate = new Date(createdAt);
          const ageDays = Math.round((today - updatedDate) / MS_PER_DAY);
          if (ageDays <= 3) {
            notifications.push({
              id: `paid-${inv.id}`,
              type: "paid",
              priority: 3,
              icon: "✅",
              title: `${name} paid ${id}`,
              subtitle: ageDays === 0 ? "Today" : `${ageDays} day${ageDays !== 1 ? "s" : ""} ago`,
              amount,
              invoiceId: inv.id,
            });
          }
        }
      }
    });

    // Sort by priority then by amount descending
    notifications.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.amount - a.amount;
    });

    const unreadCount = notifications.filter((n) => n.type !== "paid").length;

    return { notifications, unreadCount };
  }, [invoices]);
}
