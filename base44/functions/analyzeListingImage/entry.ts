import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Valid category ids (kept in sync with src/lib/constants.js)
const CATEGORY_IDS = [
  "families", "electronics", "cars", "furniture", "fashion", "realestate",
  "services", "toys", "sports", "books", "animals", "jobs", "education",
  "occasions", "antiques", "arts", "other",
];
const CATEGORY_LABELS = {
  families: { en: "Productive Families", ar: "الأسر المنتجة" },
  electronics: { en: "Electronics", ar: "إلكترونيات" },
  cars: { en: "Cars", ar: "سيارات" },
  furniture: { en: "Furniture", ar: "أثاث" },
  fashion: { en: "Fashion", ar: "أزياء" },
  realestate: { en: "Real Estate", ar: "عقارات" },
  services: { en: "Services", ar: "خدمات" },
  toys: { en: "Toys", ar: "ألعاب" },
  sports: { en: "Sports", ar: "رياضة" },
  books: { en: "Books", ar: "كتب" },
  animals: { en: "Animals", ar: "حيوانات" },
  jobs: { en: "Jobs", ar: "وظائف" },
  education: { en: "Education & Training", ar: "تدريب وتعليم" },
  occasions: { en: "Occasions", ar: "مناسبات" },
  antiques: { en: "Antiques & Rarities", ar: "نوادر وتراثيات" },
  arts: { en: "Arts & Crafts", ar: "فنون وحرف" },
  other: { en: "Other", ar: "أخرى" },
};
const CONDITIONS = ["new", "like_new", "excellent", "good", "fair", "poor"];

// Analyzes listing photos with a vision LLM and returns suggested listing
// details (title, category, condition, subcategory, description, price).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const imageUrls = Array.isArray(body?.image_urls)
      ? body.image_urls.filter((u) => typeof u === "string" && u).slice(0, 5)
      : [];
    if (!imageUrls.length) return Response.json({ error: "No images provided" }, { status: 400 });
    const lang = body?.lang === "ar" ? "ar" : "en";
    const langName = lang === "ar" ? "Arabic" : "English";

    const catList = CATEGORY_IDS.map((id) => `${id} (${CATEGORY_LABELS[id][lang]})`).join(", ");
    const prompt =
      "You are a listing assistant for a GCC buy/sell marketplace. Look at the product photo(s) and suggest listing details. " +
      `Respond entirely in ${langName}. ` +
      "- title: a concise, catchy listing title (max 50 characters). No price, no emojis, no quotes.\n" +
      `- category: MUST be exactly one of these ids: ${CATEGORY_IDS.join(", ")}. (${catList})\n` +
      "- subcategory: a single relevant subcategory name in " + langName + " for the chosen category.\n" +
      `- condition: MUST be exactly one of: ${CONDITIONS.join(", ")}.\n` +
      "- tags: 3 to 6 short, relevant attribute tags in " + langName + " (e.g. brand, material, size, color, feature).\n" +
      "- description: 1 to 2 honest sentences in " + langName + " describing the item and its condition.\n" +
      "- price_estimate: a fair second-hand market price estimate in SAR (a number).";

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        category: { type: "string" },
        subcategory: { type: "string" },
        condition: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        description: { type: "string" },
        price_estimate: { type: "number" },
      },
      required: ["title", "category", "condition", "tags", "description", "price_estimate"],
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: imageUrls,
      response_json_schema: schema,
    });

    const out = result && typeof result === "object" ? { ...result } : null;
    if (!out) return Response.json({ error: "AI returned no result" }, { status: 500 });
    if (!CATEGORY_IDS.includes(out.category)) out.category = "other";
    if (!CONDITIONS.includes(out.condition)) out.condition = "good";
    if (typeof out.price_estimate !== "number" || !isFinite(out.price_estimate)) {
      out.price_estimate = null;
    } else {
      out.price_estimate = Math.max(1, Math.round(out.price_estimate));
    }
    return Response.json({ suggestion: out });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}