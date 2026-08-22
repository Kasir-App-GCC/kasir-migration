import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, BadgeCheck, UserPlus, UserCheck, Ban, Package, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import ItemCard from "@/components/ItemCard";
import ReviewCard from "@/components/ReviewCard";
import { useBlockStatus } from "@/lib/useBlockStatus";

export default function UserProfile() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, lang } = useStore();
  const t = useT();
  const ar = lang === "ar";
  const [items, setItems] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reviewItems, setReviewItems] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [listingTab, setListingTab] = useState("active");
  const { blockedByMe, block, unblock } = useBlockStatus(id, user?.id);

  const isOwn = !!user && user.id === id;
  const name = params.get("name") || "—";
  const [avatarParam] = useState(params.get("avatar"));
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || name;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        try {
          const p = await base44.functions.invoke("getPublicProfile", { user_id: id });
          setProfile(p?.data || null);
        } catch {}
        const [mine, rs, followers, following, myFollow] = await Promise.all([
          base44.entities.Item.filter({ seller_id: id }, "-created_date", 200),
          base44.entities.Rating.filter({ rated_user_id: id }, "-created_date", 50),
          base44.entities.UserFollow.filter({ followed_id: id }, "-created_date", 200),
          base44.entities.UserFollow.filter({ follower_id: id }, "-created_date", 200),
          user?.id ? base44.entities.UserFollow.filter({ follower_id: user.id, followed_id: id }, "-created_date", 5) : Promise.resolve([]),
        ]);
        setItems(mine || []);
        setRatings(rs || []);
        setFollowersCount((followers || []).length);
        setFollowingCount((following || []).length);
        if (myFollow && myFollow.length) { setIsFollowing(true); setFollowId(myFollow[0].id); }
        else { setIsFollowing(false); setFollowId(null); }
        const itemIds = [...new Set((rs || []).map((r) => r.item_id).filter(Boolean))];
        let itemMap = {};
        if (itemIds.length) {
          try {
            const reviewIts = await base44.entities.Item.filter({ id: { $in: itemIds } }, "-created_date", itemIds.length);
            (reviewIts || []).forEach((it) => { itemMap[it.id] = it; });
          } catch {}
        }
        setReviewItems(itemMap);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!user?.id || followBusy) return;
    setFollowBusy(true);
    try {
      if (isFollowing && followId) {
        await base44.entities.UserFollow.delete(followId);
        setIsFollowing(false); setFollowId(null);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        const r = await base44.entities.UserFollow.create({ follower_id: user.id, followed_id: id });
        setIsFollowing(true); setFollowId(r?.id || null);
        setFollowersCount((c) => c + 1);
        // Notify the followed user so the follow has a real effect.
        try {
          const me = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "—";
          await base44.functions.invoke("notifyUser", {
            user_id: id,
            type: "new_follower",
            actor_id: user.id,
            actor_name: me,
            text: ar ? `بدأ ${me} بمتابعتك` : `${me} started following you`,
          });
        } catch {}
      }
    } catch {}
    setFollowBusy(false);
  };

  const toggleBlock = async () => {
    if (blockedByMe) await unblock();
    else await block(displayName);
  };

  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : "5.0";
  const activeItems = items.filter((it) => it.status !== "sold");
  const soldItems = items.filter((it) => it.status === "sold");
  const tabItems = listingTab === "active" ? activeItems : soldItems;
  const joined = profile?.created_date ? new Date(profile.created_date) : null;

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+0.75rem)] max-w-3xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </button>

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30 shrink-0">
            {(profile?.avatar || avatarParam) ? <img src={profile?.avatar || avatarParam} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-2xl font-bold">{displayName?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate flex items-center gap-1.5">
              {displayName}
              {profile?.is_trusted && <BadgeCheck size={18} className="text-sky-400 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />}
            </h1>
            {profile?.username && <p className="text-sm opacity-80 -mt-0.5 truncate">@{profile.username}</p>}
            <div className="flex items-center gap-1.5 text-sm mt-0.5">
              <Star size={14} className="fill-amber-300 text-amber-300" />
              <span className="font-bold">{avg}</span>
              <span className="opacity-70">· {ratings.length} {t("ratings")}</span>
            </div>
            {joined && (
              <p className="text-xs opacity-70 mt-0.5">{t("memberSince")} {joined.toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{activeItems.length}</p>
            <p className="text-[11px] opacity-80">{t("activeTab")}</p>
          </div>
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{soldItems.length}</p>
            <p className="text-[11px] opacity-80">{t("soldTab")}</p>
          </div>
          <div className="rounded-2xl bg-white/15 py-2.5">
            <p className="font-extrabold text-lg">{new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { notation: "compact", compactDisplay: "short" }).format(Math.max(followersCount, profile?.followers_override || 0))}</p>
            <p className="text-[11px] opacity-80">{t("followers")}</p>
          </div>
        </div>

        {!isOwn && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={toggleFollow}
              disabled={followBusy}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-60 ${isFollowing ? "bg-white/15 text-white ring-1 ring-white/30" : "bg-white text-slate-900"}`}
            >
              {isFollowing ? <><UserCheck size={16} /> {t("followingBtn")}</> : <><UserPlus size={16} /> {t("follow")}</>}
            </button>
            <button
              onClick={toggleBlock}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition ${blockedByMe ? "bg-rose-500 text-white" : "bg-white/15 text-white ring-1 ring-white/30"}`}
            >
              <Ban size={16} /> {blockedByMe ? t("unblockUser") : t("blockUser")}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-2xl mt-4">
        <button onClick={() => setListingTab("active")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${listingTab === "active" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          {t("activeTab")} ({activeItems.length})
        </button>
        <button onClick={() => setListingTab("sold")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${listingTab === "sold" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          {t("soldTab")} ({soldItems.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : tabItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {listingTab === "active" ? <Package size={32} className="mx-auto mb-2 opacity-40" /> : <CheckCircle size={32} className="mx-auto mb-2 opacity-40" />}
          <p className="font-semibold">{t("emptyFeed")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
          {tabItems.map((it) => <ItemCard key={it.id} item={it} onClick={() => nav(`/item/${it.id}`)} />)}
        </div>
      )}

      <h2 className="font-bold text-lg mt-5 mb-3">{t("reviews")} ({ratings.length})</h2>
      {ratings.length ? (
        <div className="space-y-2.5">
          {ratings.map((r) => (
            <ReviewCard key={r.id} rating={r} item={reviewItems[r.item_id]} lang={lang} t={t} />
          ))}
        </div>
      ) : (
        !loading && <div className="text-center py-10 text-muted-foreground"><p className="font-semibold">{t("noReviews")}</p></div>
      )}
    </div>
  );
}