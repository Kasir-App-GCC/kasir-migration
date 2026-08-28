// Escapes regex metacharacters in a user-supplied search string so it can be
// safely used in a MongoDB $regex query without ReDoS (catastrophic backtracking)
// or unintended pattern interpretation. Anchors to a prefix match (^) so the
// query can use an index and results are more relevant.
export function escapeRegex(str) {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}