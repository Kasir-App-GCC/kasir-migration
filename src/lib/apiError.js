// Extracts a human-readable message from a Base44 SDK error.
// The SDK throws a Base44Error whose `message` often falls back to
// "Request failed with status code N"; the actual server message lives in
// `err.data.error` (our backend functions use the `error` key).
export function apiErrorMessage(err, fallback = "") {
  if (!err) return fallback;
  return (
    err?.data?.error ||
    err?.data?.message ||
    err?.data?.detail ||
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}