/**
 * SmartInvoice Africa — useDueDateStatus
 * Returns urgency metadata for an invoice due date.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Pure function — can also be used outside a component.
 * @param {string} dueDate - ISO date string or "YYYY-MM-DD"
 * @param {string} status  - Invoice status
 * @returns {{ daysRemaining, label, color, bg, urgency }}
 */
export function getDueDateStatus(dueDate, status) {
  if (status === "paid") {
    return { daysRemaining: null, label: "Paid", color: "#1A6A40", bg: "#D4EDE3", urgency: "paid" };
  }

  if (!dueDate) {
    return { daysRemaining: null, label: "No date", color: "#6B6455", bg: "#F0EDE4", urgency: "none" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / MS_PER_DAY);

  if (diffDays < 0) {
    const d = Math.abs(diffDays);
    return {
      daysRemaining: diffDays,
      label: `${d}d overdue`,
      color: "#993A1A",
      bg: "#FAE0D5",
      urgency: "overdue",
    };
  }

  if (diffDays === 0) {
    return { daysRemaining: 0, label: "Due today", color: "#993A1A", bg: "#FAE0D5", urgency: "overdue" };
  }

  if (diffDays <= 3) {
    return { daysRemaining: diffDays, label: `${diffDays}d left`, color: "#996A10", bg: "#FFF4D6", urgency: "critical" };
  }

  if (diffDays <= 7) {
    return { daysRemaining: diffDays, label: `${diffDays}d left`, color: "#996A10", bg: "#FFF4D6", urgency: "warning" };
  }

  return {
    daysRemaining: diffDays,
    label: `${diffDays}d left`,
    color: "#1A6A40",
    bg: "#D4EDE3",
    urgency: "ok",
  };
}

/** React hook wrapper for component use */
export function useDueDateStatus(dueDate, status) {
  return getDueDateStatus(dueDate, status);
}
