import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Mail } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export default function ChatsPage() {
  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["admin-chats"],
    queryFn: adminApi.chats,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: false,
  });
  const chatRows = useMemo(() => (data?.chats as unknown as ChatMessage[]) || [], [data]);
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!chatRows.length) return;
    if (!selected || !chatRows.some((chat) => chat.id === selected.id)) {
      setSelected(chatRows[0]);
    }
  }, [chatRows, selected]);

  const messagesQuery = useQuery({
    queryKey: ["admin-chat-messages", selected?.id],
    queryFn: () => adminApi.chatMessages(selected!.id),
    enabled: Boolean(selected?.id),
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation({
    mutationFn: (body: string) => adminApi.sendChatMessage(selected!.id, body),
    onSuccess: async () => {
      setDraft("");
      await refetch();
      await messagesQuery.refetch();
    },
  });

  const conversation = messagesQuery.data?.messages || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  const handleSend = () => {
    if (draft.trim() && selected) {
      sendMessage.mutate(draft.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Chats</h1>
        <p className="text-muted-foreground text-sm mt-1">{chatRows.filter(c => c.unread > 0).length} unread conversations</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading customer conversations...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load chats right now.</CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Thread list */}
        <Card className="lg:col-span-1 overflow-auto">
          <CardContent className="p-0 divide-y">
            {chatRows.length ? (
              chatRows.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelected(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selected?.id === chat.id ? "bg-muted" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{chat.avatar}</div>
                    {chat.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-medium text-sm truncate">{chat.userName}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(chat.time).toLocaleDateString("en-KE", { dateStyle: "short" })}
                      </span>
                    </div>
                    {chat.guestEmail && (
                      <p className="text-[11px] text-gold truncate flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5 flex-shrink-0" />{chat.guestEmail}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-sm text-muted-foreground text-center">No chat threads yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {selected?.avatar}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-display truncate">{selected?.userName || "Select a chat"}</CardTitle>
                {selected?.guestEmail ? (
                  <p className="text-xs text-gold flex items-center gap-1">
                    <Mail className="h-3 w-3" />{selected.guestEmail}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{selected?.online ? "Online" : selected ? "Offline" : ""}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
            {conversation.length ? (
              <>
                {conversation.map((msg, index) => (
                  <div key={`${msg.time}-${index}`} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.from === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.from === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                {selected ? "No messages yet." : "Select a conversation to view messages."}
              </div>
            )}
          </CardContent>
          <div className="border-t p-3 flex gap-2 flex-shrink-0">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Reply to customer…"
              className="flex-1"
              disabled={!selected}
            />
            <Button size="icon" disabled={!selected || sendMessage.isPending || !draft.trim()} onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
