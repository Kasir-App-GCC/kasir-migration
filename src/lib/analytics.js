// Centralized analytics tracking for key funnel events. Wraps the base44
// analytics SDK with safe no-ops so a tracking failure never breaks UX.
import { base44 } from "@/api/base44Client";

export function track(eventName, properties) {
  try {
    base44.analytics.track({ eventName, properties: properties || {} });
  } catch {}
}

export const base44Analytics = {
  itemView: (itemId, category) => track("item_view", { item_id: itemId, category: category || null }),
  offerSent: (itemId, amount) => track("offer_sent", { item_id: itemId, amount }),
  offerAccepted: (offerId, itemId) => track("offer_accepted", { offer_id: offerId, item_id: itemId }),
  chatStarted: (itemId) => track("chat_started", { item_id: itemId }),
  listingPosted: (itemId, category) => track("listing_posted", { item_id: itemId, category: category || null }),
  boostPurchased: (itemId, hours) => track("boost_purchased", { item_id: itemId, hours }),
  searchPerformed: (query, resultCount) => track("search_performed", { query: query || null, result_count: resultCount }),
  favoriteAdded: (itemId) => track("favorite_added", { item_id: itemId }),
  profileView: (userId) => track("profile_view", { user_id: userId }),
};