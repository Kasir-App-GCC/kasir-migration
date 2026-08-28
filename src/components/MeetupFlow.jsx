import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Clock, Check, X, Navigation, ShieldAlert, Loader2, Handshake, Package, Banknote, CalendarClock, MapPinned, Star, Truck,
} from "lucide-react";
import MapPinPicker from "@/components/MapPinPicker";
import TimelineStep from "@/components/TimelineStep";
import RatingDialog from "@/components/RatingDialog";
import DisputeDialog from "@/components/DisputeDialog";
import { useToast } from "@/components/ui/use-toast";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const CHECK_IN_EARLY_MS = 5 * 60 * 1000;
const CHECK_IN_LATE_MS = 15 * 60 * 1000;

function fmt(dt, ar) {
  if (!dt) return "";
  return new Date(dt).toLocaleString(ar ? "ar-SA" : undefined, { dateStyle: "medium", timeStyle: "short" });
}
function toLocalInput(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const TYPE_CARDS = [
  { id: "meet_at_place", icon: MapPin, ar: "لقاء في مكان عام", en: "Meet at a public place" },
  { id: "buyer_pickup", icon: Package, ar: "يستلم المشتري من البائع", en: "Buyer picks up from seller" },
  { id: "seller_delivery", icon: Truck, ar: "البائع يوصل إلى المشتري", en: "Seller delivers to buyer" },
  { id: "agree_separately", icon: Handshake, ar: "نتفق على اللقاء في المحادثة", en: "Agree on the meetup in chat" },
];

export default function MeetupFlow({ offer, user, lang, otherName, meetup, onMeetupChange }) {
  const ar = lang === "ar";
  const { toast } = useToast();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [mtype, setMtype] = useState("meet_at_place");
  const [place, setPlace] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [changingTime, setChangingTime] = useState(false);
  const [suggestingPlace, setSuggestingPlace] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [rated, setRated] = useState(false);

  const isBuyer = offer.buyer_id === user.id;
  const myId = user.id;

  useEffect(() => {
    (async () => {
      try {
        const it = await base44.entities.Item.get(offer.item_id);
        setItem(it);
        const c = it?.lat && it?.lng ? { lat: it.lat, lng: it.lng } : null;
        if (c) setPlace(c);
      } catch {}
    })();
  }, [offer.item_id]);

  const act = async (payload) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("manageMeetup", payload);
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      if (data?.meetup) onMeetupChange?.(data.meetup);
      return data;
    } catch (e) {
      toast({ title: ar ? "تعذّر الإجراء" : "Action failed", description: e?.message, variant: "destructive" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const initiate = async () => {
    const payload = { action: "initiate", offer_id: offer.id, meetup_type: mtype };
    if (mtype === "meet_at_place") {
      if (!place) {
        toast({ title: ar ? "اختر المكان على الخريطة" : "Pick a place on the map", variant: "destructive" });
        return;
      }
      payload.place_lat = place.lat;
      payload.place_lng = place.lng;
      payload.place_name = placeName.trim();
    }
    const data = await act(payload);
    if (data) setPlannerOpen(false);
  };

  const startSuggest = () => {
    if (meetup?.place_lat != null && meetup?.place_lng != null) setPlace({ lat: meetup.place_lat, lng: meetup.place_lng });
    setPlaceName(meetup?.place_name || "");
    setSuggestingPlace(true);
  };

  const doRepropose = async () => {
    if (!place) {
      toast({ title: ar ? "اختر المكان على الخريطة" : "Pick a place on the map", variant: "destructive" });
      return;
    }
    const data = await act({
      action: "repropose_place",
      meetup_id: meetup.id,
      place_lat: place.lat,
      place_lng: place.lng,
      place_name: placeName.trim(),
    });
    if (data) setSuggestingPlace(false);
  };

  const submitTime = async () => {
    if (!timeInput) {
      toast({ title: ar ? "اختر الموعد" : "Pick a time", variant: "destructive" });
      return;
    }
    await act({ action: "set_time", meetup_id: meetup.id, meetup_time: new Date(timeInput).toISOString() });
    setTimeInput("");
    setChangingTime(false);
  };

  const checkIn = async () => {
    let lat = null;
    let lng = null;
    if (meetup.meetup_type !== "agree_separately") {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        toast({
          title: ar ? "تعذّر تحديد موقعك" : "Couldn't get your location",
          description: ar ? "فعّل خدمات الموقع وحاول مجدداً" : "Enable location services and retry",
          variant: "destructive",
        });
        return;
      }
    }
    await act({ action: "check_in", meetup_id: meetup.id, lat, lng });
  };

  const concluded = meetup && (meetup.status === "completed" || meetup.status === "no_show" || meetup.status === "contested");

  // ---- No meetup yet ----
  if (!meetup && !plannerOpen) {
    return (
      <button
        onClick={() => setPlannerOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold text-primary"
      >
        <MapPin size={16} /> {ar ? "خطّط لقاء التسليم" : "Plan the handover meetup"}
      </button>
    );
  }

  if (!meetup && plannerOpen) {
    const center = item?.lat && item?.lng ? { lat: item.lat, lng: item.lng } : { lat: 24.7136, lng: 46.6753 };
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm flex items-center gap-1.5"><MapPin size={15} /> {ar ? "خطّط اللقاء" : "Plan the meetup"}</p>
          <button onClick={() => setPlannerOpen(false)} className="p-1 rounded-full hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="grid gap-1.5">
          {TYPE_CARDS.map((c) => (
            <button
              key={c.id}
              onClick={() => setMtype(c.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-start text-sm font-semibold border transition ${mtype === c.id ? "bg-primary text-primary-foreground border-transparent" : "bg-muted border-border/60"}`}
            >
              <c.icon size={16} /> {ar ? c.ar : c.en}
            </button>
          ))}
        </div>
        {(mtype === "meet_at_place" || mtype === "seller_delivery") && (
          <>
            <input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value.slice(0, 80))}
              placeholder={ar ? "اسم المكان (اختياري)" : "Place name (optional)"}
              className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
            />
            <MapPinPicker center={center} radius={0} onPick={setPlace} />
          </>
        )}
        {mtype === "buyer_pickup" && (
          <p className="text-xs text-muted-foreground">{ar ? "سيكون المكان هو موقع الإعلان." : "The place will be the listing's location."}</p>
        )}
        {mtype === "seller_delivery" && (
          <p className="text-xs text-muted-foreground">{ar ? "حدّد موقع التسليم على الخريطة ليوصل إليه البائع." : "Pin the delivery spot on the map so the seller can reach you."}</p>
        )}
        {mtype === "agree_separately" && (
          <p className="text-xs text-muted-foreground">{ar ? "ستتفقان على التفاصيل داخل المحادثة، ثم تثبّتان الموعد هنا." : "You'll arrange details in chat, then lock the time here."}</p>
        )}
        <button
          onClick={initiate}
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {ar ? "إرسال الخطة" : "Send plan"}
        </button>
      </div>
    );
  }

  // ---- Meetup exists ----
  const now = Date.now();
  const mt = meetup.meetup_time ? new Date(meetup.meetup_time).getTime() : null;
  const inWindow = mt != null && now >= mt - CHECK_IN_EARLY_MS && now <= mt + CHECK_IN_LATE_MS;
  const pastWindow = mt != null && now > mt + CHECK_IN_LATE_MS;
  const iCheckedIn = isBuyer ? !!meetup.buyer_checked_in : !!meetup.seller_checked_in;
  const otherCheckedIn = isBuyer ? !!meetup.seller_checked_in : !!meetup.buyer_checked_in;
  const myChanges = isBuyer ? meetup.buyer_time_changes || 0 : meetup.seller_time_changes || 0;
  const placeMine = meetup.place_proposed_by === myId;
  const timeMine = meetup.time_proposed_by === myId;
  const canChangeTime = mt != null && now < mt - TWO_HOURS_MS && myChanges < 2 && meetup.status === "confirmed";
  const outcomesOpen = mt != null && now >= mt - CHECK_IN_EARLY_MS;
  const mapsUrl =
    meetup.place_lat != null && meetup.place_lng != null
      ? `https://www.google.com/maps?q=${meetup.place_lat},${meetup.place_lng}`
      : null;

  const Section = ({ children }) => (
    <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5">{children}</div>
  );

  const StatusPill = () => {
    const map = {
      place_proposed: { ar: "بانتظار تأكيد المكان", en: "Awaiting place confirmation" },
      place_confirmed: { ar: "تم تأكيد المكان", en: "Place confirmed" },
      time_proposed: { ar: "بانتظار تأكيد الموعد", en: "Awaiting time confirmation" },
      confirmed: { ar: "تم تأكيد الموعد", en: "Meetup confirmed" },
      completed: { ar: "اكتمل اللقاء", en: "Meetup completed" },
      no_show: { ar: "تخلّف عن الحضور", en: "No-show" },
      contested: { ar: "نتيجة متنازع عليها", en: "Contested" },
      cancelled: { ar: "ملغى", en: "Cancelled" },
    };
    const s = map[meetup.status] || { ar: meetup.status, en: meetup.status };
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{ar ? s.ar : s.en}</span>;
  };

  if (meetup.status === "cancelled") {
    return (
      <Section>
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm flex items-center gap-1.5"><MapPin size={15} /> {ar ? "اللقاء" : "Meetup"}</p>
          <StatusPill />
        </div>
        <button
          onClick={() => setPlannerOpen(true)}
          className="w-full py-2 rounded-xl bg-muted text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <CalendarClock size={14} /> {ar ? "خطّط لقاء جديد" : "Plan a new meetup"}
        </button>
      </Section>
    );
  }

  const hasPlace = meetup.meetup_type !== "agree_separately";
  const placeDone = ["place_confirmed", "time_proposed", "confirmed", "completed", "no_show", "contested"].includes(meetup.status);
  const placeActive = meetup.status === "place_proposed";
  const timeDone = ["confirmed", "completed", "no_show", "contested"].includes(meetup.status);
  const timeActive = meetup.status === "time_proposed" || meetup.status === "place_confirmed";
  const meetupActive = meetup.status === "confirmed";
  const meetupDone = concluded && meetup.status === "completed";

  let checkInSub = "";
  if (meetup.status === "confirmed") {
    if (iCheckedIn && otherCheckedIn) checkInSub = ar ? "كلاكما حاضر ✅" : "Both present ✅";
    else if (iCheckedIn) checkInSub = ar ? "حضرت — بانتظار الطرف الآخر" : "You're here — waiting for the other party";
    else if (inWindow) checkInSub = ar ? "اضغط عند وصولك" : "Tap when you arrive";
    else if (mt && now < mt - CHECK_IN_EARLY_MS) checkInSub = ar ? "يُفتح عند الموعد" : "Opens at meetup time";
    else if (pastWindow) checkInSub = ar ? "انتهت نافذة الحضور" : "Check-in window closed";
  }

  return (
    <Section>
      <div className="flex items-center justify-between mb-1">
        <p className="font-bold text-sm flex items-center gap-1.5"><MapPin size={15} /> {ar ? "لقاء التسليم" : "Handover meetup"}</p>
        <StatusPill />
      </div>

      <div className="mt-1">
        {/* ---- Place step ---- */}
        {hasPlace && (
          <TimelineStep
            state={placeDone ? "done" : placeActive ? "active" : "pending"}
            icon={MapPinned}
            title={ar ? "المكان" : "Place"}
            subtitle={meetup.place_name || (ar ? "محدد على الخريطة" : "Pinned on map")}
          >
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline inline-flex items-center gap-1">
                <MapPin size={11} /> {ar ? "فتح في الخرائط" : "Open in Maps"}
              </a>
            )}
            {meetup.status === "place_proposed" && (
              <p className="text-[11px] text-muted-foreground">
                {placeMine
                  ? ar ? `بانتظار موافقة ${otherName || "الطرف الآخر"}` : `Waiting for ${otherName || "the other party"} to confirm`
                  : ar ? "اقترح عليك المكان" : "They proposed this place"}
              </p>
            )}
            {suggestingPlace && (
              <div className="space-y-2">
                <input
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value.slice(0, 80))}
                  placeholder={ar ? "اسم المكان (اختياري)" : "Place name (optional)"}
                  className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
                />
                <MapPinPicker
                  center={place || (item?.lat && item?.lng ? { lat: item.lat, lng: item.lng } : { lat: 24.7136, lng: 46.6753 })}
                  radius={0}
                  onPick={setPlace}
                />
                <div className="flex gap-2">
                  <button onClick={doRepropose} disabled={busy} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {ar ? "إرسال المكان" : "Send place"}
                  </button>
                  <button onClick={() => setSuggestingPlace(false)} className="px-3 py-2 rounded-xl bg-muted text-xs font-bold">{ar ? "إلغاء" : "Cancel"}</button>
                </div>
              </div>
            )}
            {!suggestingPlace && meetup.status === "place_proposed" && !placeMine && (
              <div className="flex gap-2">
                <button onClick={() => act({ action: "confirm_place", meetup_id: meetup.id })} disabled={busy} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Check size={14} /> {ar ? "تأكيد المكان" : "Confirm place"}
                </button>
                <button onClick={startSuggest} disabled={busy} className="flex-1 py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <MapPin size={14} /> {ar ? "اقتراح مكان آخر" : "Suggest another"}
                </button>
              </div>
            )}
            {!suggestingPlace && meetup.status === "place_proposed" && placeMine && meetup.meetup_type === "meet_at_place" && (
              <button onClick={startSuggest} disabled={busy} className="w-full py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                <MapPin size={14} /> {ar ? "تعديل المكان" : "Adjust place"}
              </button>
            )}
          </TimelineStep>
        )}

        {/* ---- Time step ---- */}
        <TimelineStep
          state={timeDone ? "done" : timeActive ? "active" : "pending"}
          icon={Clock}
          title={ar ? "الموعد" : "Time"}
          subtitle={mt ? fmt(meetup.meetup_time, ar) : (ar ? "لم يُحدد بعد" : "Not set yet")}
        >
          {meetup.status === "place_confirmed" && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {ar ? "اقترح موعد اللقاء" : "Propose a meetup time"}</label>
              <input
                type="datetime-local"
                value={timeInput}
                min={toLocalInput(new Date())}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
              />
              <button onClick={submitTime} disabled={busy || !timeInput} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                {ar ? "إرسال الموعد" : "Send time"}
              </button>
            </div>
          )}
          {mt && meetup.status === "time_proposed" && (
            <p className="text-[11px] text-muted-foreground">
              {timeMine
                ? ar ? `بانتظار تأكيد ${otherName || "الطرف الآخر"}` : `Waiting for ${otherName || "the other party"} to confirm`
                : ar ? "اقترح عليك الموعد" : "They proposed this time"}
            </p>
          )}
          {meetup.status === "time_proposed" && !timeMine && (
            <div className="flex gap-2">
              <button onClick={() => act({ action: "confirm_time", meetup_id: meetup.id })} disabled={busy} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Check size={14} /> {ar ? "تأكيد الموعد" : "Confirm time"}
              </button>
              <button onClick={() => { setChangingTime(true); setTimeInput(""); }} disabled={busy} className="flex-1 py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Clock size={14} /> {ar ? "اقترح وقت آخر" : "Propose another"}
              </button>
            </div>
          )}
          {meetup.status === "time_proposed" && timeMine && (
            <button onClick={() => setChangingTime((v) => !v)} className="w-full py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5">
              <Clock size={14} /> {ar ? "تعديل الموعد" : "Adjust time"}
            </button>
          )}
          {(changingTime || (meetup.status === "time_proposed" && timeMine)) && (
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={timeInput}
                min={toLocalInput(new Date())}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
              />
              <button onClick={submitTime} disabled={busy || !timeInput} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
                {ar ? "تحديث الموعد" : "Update time"}
              </button>
            </div>
          )}
        </TimelineStep>

        {/* ---- Check-in step ---- */}
        <TimelineStep
          state={meetupDone ? "done" : meetupActive ? "active" : "pending"}
          icon={Navigation}
          title={ar ? "الحضور" : "Check-in"}
          subtitle={checkInSub}
        >
          {meetup.status === "confirmed" && (
            <>
              {canChangeTime && (
                <div className="space-y-2">
                  {!changingTime ? (
                    <button onClick={() => setChangingTime(true)} className="w-full py-2 rounded-xl bg-muted text-xs font-bold flex items-center justify-center gap-1.5">
                      <Clock size={14} /> {ar ? `طلب تغيير الموعد (${2 - myChanges} متبقّي)` : `Request time change (${2 - myChanges} left)`}
                    </button>
                  ) : (
                    <>
                      <input
                        type="datetime-local"
                        value={timeInput}
                        min={toLocalInput(new Date())}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-muted outline-none focus:ring-2 ring-primary/30 text-sm"
                      />
                      <div className="flex gap-2">
                        <button onClick={submitTime} disabled={busy || !timeInput} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">{ar ? "إرسال" : "Send"}</button>
                        <button onClick={() => setChangingTime(false)} className="px-3 py-2 rounded-xl bg-muted text-xs font-bold">{ar ? "إلغاء" : "Cancel"}</button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {!iCheckedIn && inWindow && (
                <button onClick={checkIn} disabled={busy} className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />} {ar ? "أنا في المكان" : "I'm at the meetup"}
                </button>
              )}
              {pastWindow && otherCheckedIn && !iCheckedIn && (
                <p className="text-[11px] text-amber-600 font-semibold text-center">{ar ? "الطرف الآخر وصل ولم تصل بعد." : "The other party showed up but you didn't."}</p>
              )}
            </>
          )}
        </TimelineStep>

        {/* ---- Outcome step ---- */}
        {outcomesOpen && !concluded && (
          <TimelineStep state="active" icon={ShieldAlert} title={ar ? "النتيجة" : "Outcome"} isLast>
            {isBuyer ? (
              <div className="grid gap-1.5">
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "received" })} disabled={busy} icon={Check} ar="استلمت السلعة" en="I received the item" tone="emerald" />
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "not_as_described" })} disabled={busy} icon={ShieldAlert} ar="السلعة غير مطابقة" en="Item not as described" tone="amber" />
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "seller_no_show" })} disabled={busy} icon={X} ar="البائع لم يحضر" en="Seller didn't show up" tone="rose" />
              </div>
            ) : (
              <div className="grid gap-1.5">
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "paid" })} disabled={busy} icon={Banknote} ar="استلمت المبلغ" en="I received the payment" tone="emerald" />
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "not_paid" })} disabled={busy} icon={ShieldAlert} ar="لم أستلم المبلغ" en="Didn't receive payment" tone="amber" />
                <OutBtn onClick={() => act({ action: "set_outcome", meetup_id: meetup.id, outcome: "buyer_no_show" })} disabled={busy} icon={X} ar="المشتري لم يحضر" en="Buyer didn't show up" tone="rose" />
              </div>
            )}
            {(isBuyer ? meetup.buyer_outcome : meetup.seller_outcome) && (
              <p className="text-[11px] text-muted-foreground text-center">{ar ? "تم تسجيل نتيجتك — بانتظار الطرف الآخر." : "Your outcome is recorded — waiting for the other party."}</p>
            )}
          </TimelineStep>
        )}

        {/* ---- Conclusion step ---- */}
        {concluded && (
          <TimelineStep state="done" icon={meetup.status === "completed" ? Check : ShieldAlert} title={ar ? "الخاتمة" : "Conclusion"} isLast>
            {meetup.status === "completed" ? (
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><Check size={12} /> {ar ? "اكتمل اللقاء بنجاح" : "Meetup completed successfully"}</p>
            ) : meetup.status === "contested" ? (
              <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1"><ShieldAlert size={12} /> {ar ? "نتيجة متنازع عليها — يمكنك فتح نزاع للمراجعة" : "Contested outcome — open a dispute for review"}</p>
            ) : (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1"><ShieldAlert size={12} /> {ar ? "تم تسجيل تخلّف عن الحضور — راجعه الإدارة" : "No-show recorded — admin will review"}</p>
            )}
            {!rated && (
              <button onClick={() => setRatingOpen(true)} className="w-full py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5">
                <Star size={13} /> {isBuyer ? (ar ? "قيّم البائع" : "Rate the seller") : (ar ? "قيّم المشتري" : "Rate the buyer")}
              </button>
            )}
            <button onClick={() => setDisputeOpen(true)} className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <ShieldAlert size={13} /> {ar ? "فتح نزاع" : "Open dispute"}
            </button>
          </TimelineStep>
        )}
      </div>

      {/* Cancel while planning */}
      {!concluded && ["place_proposed", "place_confirmed", "time_proposed", "confirmed"].includes(meetup.status) && (
        <button onClick={() => act({ action: "cancel", meetup_id: meetup.id })} disabled={busy} className="w-full py-1.5 rounded-xl text-[11px] text-muted-foreground hover:text-rose-500 font-semibold">
          {ar ? "إلغاء اللقاء" : "Cancel meetup"}
        </button>
      )}

      {ratingOpen && (
        <RatingDialog
          offer={offer}
          user={user}
          lang={lang}
          onClose={() => setRatingOpen(false)}
          onDone={() => {
            setRated(true);
            setRatingOpen(false);
          }}
        />
      )}
      {disputeOpen && (
        <DisputeDialog offer={offer} user={user} lang={lang} onClose={() => setDisputeOpen(false)} />
      )}
    </Section>
  );
}

function OutBtn({ onClick, disabled, icon: Icon, ar, en, tone }) {
  const tones = {
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-600 text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 ${tones[tone]}`}>
      <Icon size={14} /> {ar ? ar : en}
    </button>
  );
}