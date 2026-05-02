import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Heart } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PatientContext {
  risk_label?: string;
  probability?: number;
  ecg_result?: string;
}

interface ChatbotProps {
  patientContext?: PatientContext;
}

const API_URL = import.meta.env.VITE_API_URL || "";

const SUGGESTED_QUESTIONS = [
  "What does my risk score mean?",
  "What lifestyle changes should I make?",
  "What medications treat heart disease?",
  "When should I see a doctor urgently?",
];

export default function Chatbot({ patientContext }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm HeartWise AI, your cardiac health assistant. I can help explain your results, answer questions about heart disease, and suggest what to discuss with your doctor. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          patient_context: patientContext || {},
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
          boxShadow: "0 4px 20px rgba(229,62,62,0.4)",
        }}
        aria-label="Open health assistant"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!open && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
            title="Online"
          />
        )}
      </button>

      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{
          height: "520px",
          background: "var(--background)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)" }}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">HeartWise AI</p>
            <p className="text-red-100 text-xs">Cardiac Health Assistant</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            <span className="text-red-100 text-xs">Online</span>
          </div>
        </div>

        {/* Patient context banner */}
        {patientContext?.risk_label && (
          <div
            className="px-4 py-2 text-xs flex items-center gap-2 shrink-0"
            style={{
              background: patientContext.risk_label === "High Risk"
                ? "rgba(229,62,62,0.1)"
                : "rgba(72,187,120,0.1)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: patientContext.risk_label === "High Risk" ? "#e53e3e" : "#48bb78",
              }}
            />
            <span className="text-muted-foreground">
              Context loaded: <strong>{patientContext.risk_label}</strong>
              {patientContext.ecg_result && ` · ECG: ${patientContext.ecg_result}`}
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: msg.role === "assistant"
                    ? "linear-gradient(135deg,#e53e3e,#c53030)"
                    : "var(--muted)",
                }}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg,#e53e3e,#c53030)"
                      : "var(--muted)",
                    color: msg.role === "user" ? "white" : "var(--foreground)",
                    borderRadius: msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2 items-start">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#e53e3e,#c53030)" }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl"
                style={{ background: "var(--muted)", borderRadius: "18px 18px 18px 4px" }}
              >
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {showSuggestions && messages.length === 1 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground px-1">Suggested questions:</p>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors hover:bg-muted"
                  style={{ borderColor: "var(--border)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Disclaimer */}
        <div
          className="px-4 py-1.5 shrink-0"
          style={{ borderTop: "1px solid var(--border)", background: "var(--muted)" }}
        >
          <p className="text-xs text-muted-foreground text-center">
            AI assistant · Not a substitute for medical advice
          </p>
        </div>

        {/* Input */}
        <div
          className="px-3 py-3 flex gap-2 items-center shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your heart health..."
            className="flex-1 text-sm px-3 py-2 rounded-xl outline-none bg-muted placeholder:text-muted-foreground"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#e53e3e,#c53030)" }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
