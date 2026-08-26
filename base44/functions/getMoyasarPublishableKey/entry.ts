import { secrets } from "base44:runtime";

// Returns the Moyasar publishable key to the client so it can tokenize card
// details directly with Moyasar (card data never reaches our backend). The
// publishable key is safe to expose to the client — that is its purpose.
export default async function (req: Request): Promise<Response> {
  const publishableKey = secrets.get("MOYASAR_PUBLISHABLE_KEY") || "";
  return Response.json({ publishable_key: publishableKey });
}