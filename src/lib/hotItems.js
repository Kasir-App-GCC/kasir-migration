// An item is "hot" if it has accumulated enough views AND was posted recently.
// This is a client-side heuristic — no backend or schema changes needed.
// Threshold: >= 10 views AND created within the last 48 hours.
export function isHotItem(item) {
  if (!item || !item.created_date) return false;
  const views = Number(item.views) || 0;
  if (views < 10) return false;
  const ageHours = (Date.now() - new Date(item.created_date).getTime()) / (1000 * 60 * 60);
  return ageHours <= 48;
}