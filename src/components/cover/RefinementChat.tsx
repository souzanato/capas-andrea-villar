"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, User, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface RefinementChatProps {
  coverId: string;
  initialMessages: ChatMessage[];
  isProcessing: boolean;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "há alguns segundos";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `há ${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `há ${diffDay}d`;
  return date.toLocaleDateString("pt-BR");
}

export default function RefinementChat({
  coverId,
  initialMessages,
  isProcessing,
}: RefinementChatProps) {
  const router = useRouter();
  const [localMessages, setLocalMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from props when server re-renders (after router.refresh())
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom (apenas quando novas mensagens aparecem, não no inicial)
  const isFirstRender = useRef(true);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  // Auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    // Reset height to auto so shrinking works, then set to scrollHeight
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isGenerating || isProcessing) return;

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, optimisticMessage]);
    setInputValue("");
    setIsGenerating(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/covers/${coverId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao enviar refino");
      }

      // Refresh — server component will fetch fresh data
      router.refresh();
    } catch (error) {
      // Remove optimistic message
      setLocalMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar refino"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isDisabled = isGenerating || isProcessing;

  return (
    <div className="rounded-lg border bg-card flex flex-col h-[500px]">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Refino</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Peça ajustes para a capa
        </p>
      </div>

      {/* Processing warning */}
      {isProcessing && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-b text-xs text-yellow-800">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Aguarde a geração atual terminar antes de refinar.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {localMessages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground gap-2">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p>
              Nenhum ajuste ainda.
              <br />
              Peça alterações como &quot;aumenta o texto principal&quot; ou
              &quot;muda a cor do título para azul&quot;.
            </p>
          </div>
        )}

        {localMessages.map((msg) => {
          const isUser = msg.role === "USER";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </div>

              {/* Bubble */}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                <span
                  className={`text-[10px] text-muted-foreground mt-1 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Gerando nova versão...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Peça um ajuste... (ex: 'aumenta o texto principal')"
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[36px] max-h-[120px]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isDisabled || inputValue.trim().length === 0}
            className="shrink-0 h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
