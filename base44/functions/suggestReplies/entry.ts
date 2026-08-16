import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

function detectLang(text) {
  return /[\u0600-\u06FF]/.test(text || "") ? "ar" : "en";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
    const role = body?.role === "seller" ? "seller" : "buyer";
    const itemTitle = String(body?.itemTitle || "").slice(0, 120);
    const itemPrice = body?.itemPrice;

    const myId = user.id;
    const transcript = messages
      .map((m) => `${m.sender_id === myId ? "Me" : "Them"}: ${String(m.text || "").slice(0, 200)}`)
      .join("\n");
    const lastIncoming = [...messages].reverse().find((m) => m.sender_id !== myId);
    const lang = lastIncoming ? detectLang(lastIncoming.text) : "en";
    const langInstr = lang === "ar"
      ? "Saudi Arabic (use Saudi dialect, e.g. وش, تبي, الحين, أيوالله)"
      : "English";

    const prompt =
      "You help a user in a Saudi local marketplace chat. The user is the " + role +
      ' talking about the item: "' + itemTitle + '"' +
      (itemPrice != null ? " priced at " + itemPrice + " SAR" : "") + ".\n\n" +
      "Conversation so far:\n" + (transcript || "(no messages yet)") + "\n\n" +
      "Suggest 3 short, natural replies the " + role + " could send next. " +
      "Each must be a complete ready-to-send message in " + langInstr + ", friendly and under 12 words. " +
      "Output ONLY the replies, one per line, no numbers, no quotes, no extra text.";

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = typeof res === "string" ? res : (res && res.content) || "";
    const suggestions = String(text)
      .split("\n")
      .map((s) => s.replace(/^[\s\d.\-)]+/, "").replace(/^["']|["']$/g, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}