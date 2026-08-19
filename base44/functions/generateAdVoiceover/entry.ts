import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Arabic voice-over lines for the in-app ad reel scenes.
const LINES = [
  "حدّد دولتك، وابدأ التسوق من حولك",
  "تصفّح أحدث الإعلانات، قريب منك",
  "صوّر منتجك، حدّد السعر والحالة، وانشره في ثوانٍ",
  "اطلب عرضك، اتّفق على السعر، وحدّد مكان اللقاء",
  "كاسر، سوقك الرقمي في الخليج",
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const urls = [];
    for (const text of LINES) {
      const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text,
        language_code: "ar",
      });
      urls.push(res.url);
    }
    return Response.json({ urls });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}