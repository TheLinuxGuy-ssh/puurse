import {daysLeft} from "./dates.js";

export function spent(transactions, categoryId, period) {
  return transactions
    .filter(t => t.type === "expense" && t.date >= period.start && t.date <= period.end && (categoryId === null || t.categoryId === categoryId))
    .reduce((total, t) => total + t.amount, 0);
}

export function budgetStatus(limit, value) {
  if (!limit || limit <= 0) return {status: "none", percent: 0, remaining: 0};
  const ratio = value / limit * 100;
  const percent = Math.round(ratio);
  return {status: ratio >= 100 ? "over" : ratio >= 80 ? "warn" : "ok", percent, remaining: limit - value};
}

export function safeToSpendToday(transactions, overallLimit, period, date) {
  const remaining = overallLimit - spent(transactions, null, {...period, end: date});
  return Math.max(0, Math.floor(remaining / daysLeft(date, period)));
}
