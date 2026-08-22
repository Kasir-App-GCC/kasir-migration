// Shared secret used to authenticate workflow-to-function calls.
//
// Each workflow that invokes a backend function passes this value in the
// `secret` arg; each guarded function verifies it before doing any work.
// Both the workflow definitions and this function source live server-side
// (they are never shipped to the client), so the value is not exposed to the
// public internet — only the function's public URL is, and this check stops
// external callers from abusing it.
export const WORKFLOW_SECRET = "kasir_wf_8d3f2a9c4e1b";