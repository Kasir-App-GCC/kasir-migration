import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, ShoppingBag, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import ItemCard from "@/components/ItemCard";

const AGENT_NAME = "shopping_assistant";

const SUGGESTIONS_AR = [
  "دور لي على ايفون 15 بسعر معقول في الرياض",
  "وش أرخص سيارات مستعملة تحت 30 ألف؟",
  "أبي أثاث مكتبي مستعمل بحالة ممتازة",
  "دور لي على ألعاب أطفال للأسر المنتجة",
];
const SUGGESTIONS_EN = [
  "Find me a reasonably priced iPhone 15 in Riyadh",
  "What used cars are available under 30k SAR?",
  "Looking for excellent-condition used office furniture",
  "Find kids' toys from productive families",
];

function parseResultsItems(toolCalls) {
  const items = [];
  (toolCalls || []).forEach((tc) => {
    if (!tc.results) return;
    const str = typeof tc.results === "string" ? tc.results : JSON.stringify(tc.results);
    if (!str || str.trim() === "[]") return;
    // Match each flat item dict — handles one or many items per tool-call result.
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
        price: fnum(d, "price"),
        city: fstr(d, "city") || "",
        condition: fstr(d, "condition") || "good",
        category: fstr(d, "category") || "",
        images: [],
        status: "available",
        is_family: false,
        created_date: new Date().toISOString(),
      });
    });
  });
  const seen = new Set();
  return items.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

function MessageBubble({ message, onItemClick, itemMap, parsedByMsg }) {
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
  const parsed = (message.id && parsedByMsg?.[message.id]) || parseResultsItems(message.tool_calls);
  const items = parsed.map((p) => itemMap?.[p.id] || p).filter(Boolean);
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {message.content && (
          <div className="rounded-2xl rounded-bl-md bg-card border border-border/60 px-4 py-3 text-sm">
            <ReactMarkdown
              className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1.5 [&_li]:my-0.5"
              components={{
                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
            {message.tool_calls?.map((tc, i) => (
              <ToolCallBadge key={i} toolCall={tc} />
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {items.map((it) => (
              <div key={it.id} className="w-40 shrink-0">
                <ItemCard item={it} onClick={() => onItemClick?.(it.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallBadge({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status;
  const failed = status === "failed" || status === "error";
  const label =
    status === "pending" || status === "running" || status === "in_progress"
      ? "Searching…"
      : failed
      ? "Search failed"
      : "Search complete";
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <Sparkles size={12} className={failed ? "text-rose-500" : "text-amber-500"} />
      {label}
    </button>
  );
}

export default function ShoppingAssistant() {
  const nav = useNavigate();
  const { lang } = useStore();
  const t = useT();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [itemCache, setItemCache] = useState({});
  const [parsedByMsg, setParsedByMsg] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        const storedId = localStorage.getItem("souqna_assistant_convo_id");
        let convo = (convos || []).find((c) => c.id === storedId) || convos?.[0];
        if (!convo) {
          convo = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Shopping Assistant", description: "Marketplace discovery helper" },
          });
        }
        localStorage.setItem("souqna_assistant_convo_id", convo.id);
        setConversation(convo);
        setMessages(convo.messages || []);
        // Parse items from the initial messages immediately. The real-time
        // subscription can deliver messages with stripped tool-call results,
        // so we can't rely on the messages-state effect alone to populate cards.
        const initParsed = {};
        (convo.messages || []).forEach((m) => {
          if (m.role !== "assistant" || !m.tool_calls?.length || !m.id) return;
          const parsed = parseResultsItems(m.tool_calls);
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

  // Merge newly-parsed items from incoming messages (real-time subscription updates).
  // Existing entries persist, so cards survive updates that strip tool-call results.
  useEffect(() => {
    const byMsg = {};
    messages.forEach((m) => {
      if (m.role !== "assistant" || !m.tool_calls?.length || !m.id) return;
      const parsed = parseResultsItems(m.tool_calls);
      if (parsed.length) byMsg[m.id] = parsed;
    });
    if (!Object.keys(byMsg).length) return;
    setParsedByMsg((prev) => {
      const next = { ...prev };
      Object.keys(byMsg).forEach((k) => { if (!(k in next)) next[k] = byMsg[k]; });
      return next;
    });
  }, [messages]);

  // Fetch full item records (with real images) for every parsed item.
  useEffect(() => {
    const ids = new Set();
    Object.values(parsedByMsg).forEach((arr) => arr.forEach((p) => ids.add(p.id)));
    const missing = Array.from(ids).filter((id) => !itemCache[id]);
    if (!missing.length) return;
    Promise.all(missing.map((id) => base44.entities.Item.get(id).catch(() => null))).then((results) => {
      setItemCache((prev) => {
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
        metadata: { name: "Shopping Assistant", description: "Marketplace discovery helper" },
      });
      localStorage.setItem("souqna_assistant_convo_id", convo.id);
      setConversation(convo);
      setMessages([]);
    } catch {}
  };

  const suggestions = lang === "ar" ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 sticky top-0 bg-background/90 backdrop-blur z-10">
        <button onClick={() => nav(-1)} className="p-1.5 rounded-full hover:bg-muted">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
          <ShoppingBag size={18} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">
            {lang === "ar" ? "مساعد التسوق" : "Shopping Assistant"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "يدور لك على اللي تبيه" : "Finds what you're looking for"}
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={!conversation || messages.length === 0}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground disabled:opacity-40"
          title={lang === "ar" ? "حذف المحادثة" : "Delete chat"}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mx-auto mb-3">
              <ShoppingBag size={26} />
            </div>
            <h2 className="font-bold text-lg">
              {lang === "ar" ? "وش تبي تدور عليه؟" : "What are you looking for?"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {lang === "ar"
                ? "وصف لي اللي تبيه وأساعدك تلاقيه في السوق"
                : "Describe what you need and I'll help you find it in the marketplace"}
            </p>
            <div className="grid gap-2 text-start">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full px-4 py-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/50 transition text-sm text-start flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} itemMap={itemCache} parsedByMsg={parsedByMsg} onItemClick={(id) => nav(`/item/${id}`)} />
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
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/60 bg-background sticky bottom-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={lang === "ar" ? "اكتب وصف اللي تبيه…" : "Describe what you're looking for…"}
            className="flex-1 px-4 py-3 rounded-full bg-muted outline-none text-sm"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send size={18} className="rtl:rotate-180" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-xs mx-4 bg-background rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-lg mb-1">
              {lang === "ar" ? "حذف المحادثة؟" : "Delete chat?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {lang === "ar"
                ? "بيتم مسح كل الرسائل وتبدأ محادثة جديدة."
                : "All messages will be cleared and a new chat will start."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-2xl border border-border font-bold text-sm"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={deleteChat}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm"
              >
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}