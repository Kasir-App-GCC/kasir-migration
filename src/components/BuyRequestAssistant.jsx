import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Megaphone, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import ReactMarkdown from "react-markdown";
import BuyRequestCard from "@/components/BuyRequestCard";
import BuyRequestOfferDialog from "@/components/BuyRequestOfferDialog";
import { useSellerInfo } from "@/lib/useTrusted";

const AGENT_NAME = "buy_request_assistant";

const SUGGESTIONS_AR = [
  "أنا أبيع ايفونات مستعملة، فيه طلبات شراء لها؟",
  "عندي أثاث مكتبي، من يدور عليه؟",
  "أبيع إكسسوارات سيارات في الرياض، فيه طلبات؟",
  "وش الطلبات النشطة في قسم الإلكترونيات؟",
];
const SUGGESTIONS_EN = [
  "I sell used iPhones, are there buy requests for them?",
  "I have office furniture, who's looking for it?",
  "I sell car accessories in Riyadh, any requests?",
  "What active requests are in the electronics category?",
];

function parseResultsRequests(toolCalls) {
  const items = [];
  (toolCalls || []).forEach((tc) => {
    if (!tc.results) return;
    const str = typeof tc.results === "string" ? tc.results : JSON.stringify(tc.results);
    if (!str || str.trim() === "[]") return;
    const dicts = str.match(/\{[^{}]*\}/g) || [];
    const fstr = (d, key) => {
      const m = d.match(new RegExp("['\"]" + key + "['\"]:\\s*['\"]([^'\"]*)['\"]"));
      return m ? m[1] : "";
    };
    const fnum = (d, key) => {
      const m = d.match(new RegExp("['\"]" + key + "['\"]:\\s*([0-9.]+)"));
      return m ? Number(m[1]) : 0;
    };
    dicts.forEach((d) => {
      const id = (d.match(/['"]id['"]:\s*['"]([a-f0-9]{24})['"]/) || [])[1];
      if (!id) return;
      items.push({
        id,
        title: fstr(d, "title") || "",
        description: fstr(d, "description") || "",
        budget: fnum(d, "budget") || null,
        city: fstr(d, "city") || "",
        category: fstr(d, "category") || "",
        country: fstr(d, "country") || "SA",
        user_id: fstr(d, "user_id") || "",
        user_name: fstr(d, "user_name") || "",
        user_avatar: fstr(d, "user_avatar") || "",
        tags: [],
        subcategory: [],
        whatsapp_enabled: false,
        whatsapp_number: "",
        status: "open",
        created_date: new Date().toISOString(),
      });
    });
  });
  const seen = new Set();
  return items.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

function MessageBubble({ message, onItemClick, onUserClick, onVerify, canContact, reqMap, parsedByMsg }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  const parsed = (message.id && parsedByMsg?.[message.id]) || parseResultsRequests(message.tool_calls);
  const reqs = parsed.map((p) => reqMap?.[p.id] || p).filter(Boolean);
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {message.content && (
          <div className="rounded-2xl rounded-bl-md bg-card border border-border/60 px-4 py-3 text-sm">
            <ReactMarkdown
              className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1.5 [&_li]:my-0.5"
              components={{
                a: ({ node, ...props }) => <span {...props} />,
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
            {message.tool_calls?.map((tc, i) => {
              const status = tc.status;
              const failed = status === "failed" || status === "error";
              const label =
                status === "pending" || status === "running" || status === "in_progress"
                  ? "Searching…"
                  : failed
                  ? "Search failed"
                  : "Search complete";
              return (
                <div key={i} className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles size={12} className={failed ? "text-rose-500" : "text-violet-500"} />
                  {label}
                </div>
              );
            })}
          </div>
        )}
        {reqs.length > 0 && (
          <div className="mt-2 space-y-2">
            {reqs.map((r) => (
              <BuyRequestCard
                key={r.id}
                req={r}
                tab="browse"
                canContact={canContact}
                onChat={(req) => onItemClick?.(req)}
                onUserClick={(uid) => onUserClick?.(uid)}
                onVerify={() => onVerify?.()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyRequestAssistant({ onClose }) {
  const nav = useNavigate();
  const { user, lang, country } = useStore();
  const myInfo = useSellerInfo(user?.id);
  const canContact = !!myInfo.trusted;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reqCache, setReqCache] = useState({});
  const [parsedByMsg, setParsedByMsg] = useState({});
  const [offerDialogReq, setOfferDialogReq] = useState(null);
  const [canContactState, setCanContactState] = useState(false);
  const scrollRef = useRef(null);
  const refetchTimer = useRef(null);

  useEffect(() => {
    setCanContactState(canContact);
  }, [canContact]);

  useEffect(() => {
    (async () => {
      try {
        const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        const storedId = localStorage.getItem("souqna_br_assistant_convo_id");
        let convo = (convos || []).find((c) => c.id === storedId) || convos?.[0];
        if (!convo) {
          convo = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Buy Request Assistant", description: "Helps sellers find buy requests" },
          });
        }
        localStorage.setItem("souqna_br_assistant_convo_id", convo.id);
        setConversation(convo);
        setMessages(convo.messages || []);
        const initParsed = {};
        (convo.messages || []).forEach((m) => {
          if (m.role !== "assistant" || !m.tool_calls?.length || !m.id) return;
          const parsed = parseResultsRequests(m.tool_calls);
          if (parsed.length) initParsed[m.id] = parsed;
        });
        setParsedByMsg(initParsed);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const byMsg = {};
    const needsRefetch = [];
    const pending = new Set(["pending", "running", "in_progress"]);
    messages.forEach((m) => {
      if (m.role !== "assistant" || !m.tool_calls?.length || !m.id) return;
      const parsed = parseResultsRequests(m.tool_calls);
      if (parsed.length) {
        byMsg[m.id] = parsed;
      } else if (m.tool_calls.some((tc) => tc.status && !pending.has(tc.status))) {
        needsRefetch.push(m.id);
      }
    });
    if (Object.keys(byMsg).length) {
      setParsedByMsg((prev) => {
        const next = { ...prev };
        Object.keys(byMsg).forEach((k) => { if (!(k in next)) next[k] = byMsg[k]; });
        return next;
      });
    }
    if (needsRefetch.length && conversation?.id) {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(async () => {
        try {
          const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
          const convo = (convos || []).find((c) => c.id === conversation.id);
          if (!convo) return;
          const fresh = {};
          (convo.messages || []).forEach((m) => {
            if (m.role !== "assistant" || !m.tool_calls?.length || !m.id) return;
            const parsed = parseResultsRequests(m.tool_calls);
            if (parsed.length) fresh[m.id] = parsed;
          });
          if (Object.keys(fresh).length) setParsedByMsg((prev) => ({ ...prev, ...fresh }));
        } catch {}
      }, 700);
    }
    return () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); };
  }, [messages, conversation?.id]);

  useEffect(() => {
    const ids = new Set();
    Object.values(parsedByMsg).forEach((arr) => arr.forEach((p) => ids.add(p.id)));
    const missing = Array.from(ids).filter((id) => !reqCache[id]);
    if (!missing.length) return;
    Promise.all(missing.map((id) => base44.entities.BuyRequest.get(id).catch(() => null))).then((results) => {
      setReqCache((prev) => {
        const next = { ...prev };
        results.forEach((r) => { if (r && r.id) next[r.id] = r; });
        return next;
      });
    });
  }, [parsedByMsg]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || !conversation || sending) return;
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch {
    } finally {
      setSending(false);
    }
  };

  const deleteChat = async () => {
    setConfirmDelete(false);
    try {
      const convo = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: "Buy Request Assistant", description: "Helps sellers find buy requests" },
      });
      localStorage.setItem("souqna_br_assistant_convo_id", convo.id);
      setConversation(convo);
      setMessages([]);
      setParsedByMsg({});
    } catch {}
  };

  const suggestions = lang === "ar" ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background/90 backdrop-blur shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
          <Megaphone size={18} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">
            {lang === "ar" ? "مساعد طلبات الشراء" : "Buy Request Assistant"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "يدور لك على الطلبات اللي تناسب مبيعاتك" : "Finds buy requests matching your inventory"}
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={!conversation || messages.length === 0}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground disabled:opacity-40"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-3">
                  <Megaphone size={26} />
                </div>
                <h2 className="font-bold text-lg">
                  {lang === "ar" ? "وش تبي تبيع؟" : "What do you sell?"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {lang === "ar"
                    ? "وصف لي اللي تبي تبيعه وأساعدك تلاقي طلبات شراء مناسبة"
                    : "Describe what you sell and I'll find matching buy requests"}
                </p>
                <div className="grid gap-2 text-start">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full px-4 py-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/50 transition text-sm text-start flex items-center gap-2"
                    >
                      <Sparkles size={14} className="text-violet-500 shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                reqMap={reqCache}
                parsedByMsg={parsedByMsg}
                canContact={canContactState}
                onItemClick={(req) => {
                  if (!canContactState) {
                    nav("/profile");
                    return;
                  }
                  setOfferDialogReq(req);
                }}
                onUserClick={(uid) => {
                  if (canContactState) nav(`/user/${uid}`);
                }}
                onVerify={() => nav("/profile")}
              />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-card border border-border/60 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/60 bg-background shrink-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={lang === "ar" ? "صف اللي تبي تبيعه…" : "Describe what you sell…"}
            className="flex-1 px-4 py-3 rounded-full bg-muted outline-none text-sm"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-violet-500 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-xs mx-4 bg-background rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-lg mb-1">
              {lang === "ar" ? "حذف المحادثة؟" : "Delete chat?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {lang === "ar" ? "بيتم مسح كل الرسائل وتبدأ محادثة جديدة." : "All messages will be cleared and a new chat will start."}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-2xl border border-border font-bold text-sm">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={deleteChat} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm">
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {offerDialogReq && (
        <BuyRequestOfferDialog
          req={offerDialogReq}
          user={user}
          lang={lang}
          country={country}
          onClose={() => setOfferDialogReq(null)}
          onSent={(chatId) => { setOfferDialogReq(null); nav(`/chat/${chatId}`); }}
        />
      )}
    </div>
  );
}