import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { askHRAssistant } from "../../services/firestoreService";
import { X, Send, Bot, User, RotateCcw, Sparkles } from "lucide-react";

export default function AIAssistantPanel({ open, onClose }) {
  const { user, profile, company } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "initial",
      role: "assistant",
      content: `Hello ${profile?.name || "there"}! I'm your HCM AI Assistant.\n\nAsk me about employees, attendance, departments, or leaves.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async (textToSend = null) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg = {
      id: "user-" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const compId = company?.id || profile?.companyId;
      const response = await askHRAssistant(prompt, compId, profile);
      setMessages((prev) => [
        ...prev,
        { id: "bot-" + Date.now(), role: "assistant", content: response, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: err.message || "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "reset-" + Date.now(),
        role: "assistant",
        content: "Chat refreshed. How can I help?",
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    "Active headcount",
    "Today's check-ins",
    "Pending leaves",
    "Department breakdown",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-[#DBE2EF] z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBE2EF] bg-[#112D4E] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3F72AF] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">AI HR Assistant</h2>
              <p className="text-[10px] text-[#DBE2EF]/70">Live Firestore queries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetChat}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Reset chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Chips */}
        <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-[#DBE2EF] bg-[#F9F7F7] shrink-0">
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 bg-white border border-[#DBE2EF] text-[#112D4E] font-medium rounded-full hover:border-[#3F72AF] hover:text-[#3F72AF] transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
                  m.role === "user" ? "bg-[#3F72AF]" : "bg-[#112D4E]"
                }`}
              >
                {m.role === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-[#DBE2EF]" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#3F72AF] text-white rounded-br-sm"
                    : "bg-[#F9F7F7] border border-[#DBE2EF] text-[#112D4E] rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <span
                  className={`block text-[9px] mt-1 ${
                    m.role === "user" ? "text-white/50 text-right" : "text-[#112D4E]/35"
                  }`}
                >
                  {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-[#112D4E] flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5 text-[#DBE2EF]" />
              </div>
              <div className="bg-[#F9F7F7] border border-[#DBE2EF] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs text-[#112D4E]/60 flex items-center gap-2">
                <div className="w-2.5 h-2.5 border-2 border-[#3F72AF] border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-[#DBE2EF] p-3 bg-white">
          <div className="flex items-center gap-2 bg-[#F9F7F7] border border-[#DBE2EF] rounded-xl px-3 py-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about employees, attendance..."
              className="flex-1 bg-transparent px-1 py-2 text-xs text-[#112D4E] focus:outline-none placeholder-[#112D4E]/40"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-3 py-1.5 bg-[#3F72AF] text-white text-xs font-semibold rounded-lg hover:bg-[#112D4E] transition-colors disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
