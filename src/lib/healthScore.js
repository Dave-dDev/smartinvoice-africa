/**
 * SmartInvoice Africa — Business Health Score
 * Pure function, no React dependency.
 *
 * Score factors (total 100 pts):
 *  - Collection rate    25 pts
 *  - Expense ratio      25 pts
 *  - Revenue growth     20 pts
 *  - Overdue exposure   20 pts
 *  - Invoice velocity   10 pts
 */

export function computeHealthScore({ invoices = [], expenses = [], monthlyRevenue = [], monthlyExpenses = [] }) {
  const factors = [];
  let totalScore = 0;

  // ── Factor 1: Collection Rate (25 pts) ─────────────────────────────────────
  const totalInvoiced = invoices.reduce((a, b) => a + (b.total || b.amount || 0), 0);
  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((a, b) => a + (b.total || b.amount || 0), 0);
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
  const collectionScore = Math.round((collectionRate / 100) * 25);
  totalScore += collectionScore;
  factors.push({
    name: "Collection Rate",
    score: collectionScore,
    max: 25,
    value: `${collectionRate.toFixed(1)}%`,
    status: collectionRate >= 70 ? "good" : collectionRate >= 50 ? "warning" : "bad",
    tip: collectionRate < 70 ? "Chase overdue invoices — send WhatsApp reminders" : null,
  });

  // ── Factor 2: Expense Ratio (25 pts) ───────────────────────────────────────
  const totRev = monthlyRevenue.reduce((a, b) => a + b, 0);
  const totExp = monthlyExpenses.reduce((a, b) => a + b, 0);
  const expenseRatio = totRev > 0 ? (totExp / totRev) * 100 : 100;
  // Best = <40%, worst = >90%
  const expRatioScore = Math.round(Math.max(0, Math.min(25, ((90 - expenseRatio) / 50) * 25)));
  totalScore += expRatioScore;
  factors.push({
    name: "Expense Ratio",
    score: expRatioScore,
    max: 25,
    value: `${expenseRatio.toFixed(1)}%`,
    status: expenseRatio < 60 ? "good" : expenseRatio < 75 ? "warning" : "bad",
    tip: expenseRatio >= 75 ? "Expenses are high relative to revenue — review inventory and transport costs" : null,
  });

  // ── Factor 3: Revenue Growth (20 pts) ──────────────────────────────────────
  const n = monthlyRevenue.length;
  let growthScore = 10; // neutral baseline
  let growthValue = "N/A";
  if (n >= 2) {
    const recent = monthlyRevenue[n - 1];
    const prev = monthlyRevenue[n - 2];
    const growth = prev > 0 ? ((recent - prev) / prev) * 100 : 0;
    growthValue = `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;
    // +20% or more → 20 pts, -20% or less → 0 pts
    growthScore = Math.round(Math.max(0, Math.min(20, ((growth + 20) / 40) * 20)));
  }
  totalScore += growthScore;
  factors.push({
    name: "Revenue Growth",
    score: growthScore,
    max: 20,
    value: growthValue,
    status: growthScore >= 14 ? "good" : growthScore >= 8 ? "warning" : "bad",
    tip: growthScore < 8 ? "Revenue declined last month — review your customer pipeline" : null,
  });

  // ── Factor 4: Overdue Exposure (20 pts) ────────────────────────────────────
  const overdueAmt = invoices
    .filter((i) => i.status === "overdue")
    .reduce((a, b) => a + (b.total || b.amount || 0), 0);
  const overdueRatio = totalInvoiced > 0 ? (overdueAmt / totalInvoiced) * 100 : 0;
  // <5% → 20 pts, >40% → 0 pts
  const overdueScore = Math.round(Math.max(0, Math.min(20, ((40 - overdueRatio) / 35) * 20)));
  totalScore += overdueScore;
  factors.push({
    name: "Overdue Exposure",
    score: overdueScore,
    max: 20,
    value: `${overdueRatio.toFixed(1)}%`,
    status: overdueRatio < 10 ? "good" : overdueRatio < 25 ? "warning" : "bad",
    tip: overdueRatio >= 10 ? `${invoices.filter(i => i.status === "overdue").length} invoices overdue — take action now` : null,
  });

  // ── Factor 5: Invoice Velocity (10 pts) ────────────────────────────────────
  // Based on total invoice count — more active = better (up to 20 invoices = 10 pts)
  const velocity = Math.min(10, Math.round((invoices.length / 20) * 10));
  totalScore += velocity;
  factors.push({
    name: "Invoice Activity",
    score: velocity,
    max: 10,
    value: `${invoices.length} invoices`,
    status: invoices.length >= 10 ? "good" : invoices.length >= 5 ? "warning" : "bad",
    tip: invoices.length < 5 ? "Create more invoices to track your revenue pipeline" : null,
  });

  // ── Grade ────────────────────────────────────────────────────────────────────
  const score = Math.min(100, Math.max(0, totalScore));
  let grade, gradeColor, gradeBg;
  if (score >= 80) {
    grade = "A"; gradeColor = "#1A6A40"; gradeBg = "#D4EDE3";
  } else if (score >= 65) {
    grade = "B"; gradeColor = "#1A7A50"; gradeBg = "#D4EDE3";
  } else if (score >= 50) {
    grade = "C"; gradeColor = "#996A10"; gradeBg = "#FFF4D6";
  } else if (score >= 35) {
    grade = "D"; gradeColor = "#C4522A"; gradeBg = "#FAE0D5";
  } else {
    grade = "F"; gradeColor = "#993A1A"; gradeBg = "#FAE0D5";
  }

  // ── Priority Actions ──────────────────────────────────────────────────────────
  const actions = factors
    .filter((f) => f.tip)
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .slice(0, 3)
    .map((f) => f.tip);

  return { score, grade, gradeColor, gradeBg, factors, actions };
}
