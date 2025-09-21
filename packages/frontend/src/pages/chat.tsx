/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Sohbet sayfası - AI asistanı ile gerçek zamanlı mesajlaşma arayüzü
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation } from "@tanstack/react-query"
import { 
  Send, 
  Bot, 
  User, 
  Copy,
  Trash2,
  Plus
} from "lucide-react"
import { Combobox } from "@ark-ui/react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Avatar, AvatarFallback } from "@/components/ui/Avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ChatEmptyState } from "@/components/ui/empty-state"
import { Tooltip } from "@/components/ui/Tooltip"
import { cn, formatRelativeTime, generateId } from "@/lib/utils"
import toast from "react-hot-toast"
import { apiClient } from "@/services/api-client"
import { PROVIDERS, LMSTUDIO_MODELS, useSelectedProvider, useProviderModel } from "@/lib/ai/providers"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isLoading?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

const initialSessions: ChatSession[] = [
  {
    id: "1",
    title: "React öğrenme rehberi",
    messages: [
      {
        id: "1",
        content: "React nasıl öğrenebilirim?",
        role: "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: "2",
        content: "React öğrenmek için şu adımları öneriyorum:\n\n1. **JavaScript temelleri**: ES6+ özelliklerini öğrenin\n2. **React temelleri**: Component, props, state kavramlarını anlayın\n3. **Hooks**: useState, useEffect gibi temel hook'ları öğrenin\n4. **Proje geliştirin**: Küçük projelerle pratik yapın\n\nHangi seviyedesiniz?",
        role: "assistant",
        timestamp: new Date(Date.now() - 1000 * 60 * 29)
      }
    ],
    lastMessage: new Date(Date.now() - 1000 * 60 * 29)
  }
]

export function Chat() {
  const [sessions, setSessions] = React.useState<ChatSession[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(sessions[0]?.id || null)
  const [message, setMessage] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [provider, setProvider] = useSelectedProvider()
  const [modelName, setModelName] = useProviderModel(provider)

  // useMutation: API'ye mesaj göndermek için kullanılır. Başarılı olduğunda onSuccess,
  // hata olduğunda onError tetiklenir.
  // useMutation: Used to send the message to the API. onSuccess runs on success, onError when the request fails.
  const chatMutation = useMutation({
    mutationFn: async (userText: string) => {
      // Mesajı backend'e gönderir. Eğer backend'deki doğru endpoint farklıysa burada güncelleyin.
      // Sends the user's message to the backend. Update the endpoint here if your backend differs.
      return apiClient.post<{ content?: string; message?: string }>("/api/chat", { message: userText })
    },
    onError: (error: Error) => {
      toast.error(error?.message || "AI isteği başarısız oldu")
    }
  })

  const activeSession = sessions.find(s => s.id === activeSessionId)

  // Boş ekran hatasını önlemek için 'activeSession' verisinin varlığı kontrol edildi.
  // Eğer aktif oturum yoksa ve listede en az bir oturum varsa ilkini seç.
  React.useEffect(() => {
     if (!activeSessionId && sessions[0]?.id) {
      setActiveSessionId(sessions[0].id)
  }
  }, [sessions, activeSessionId])
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
 
  React.useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages])

  const sendMessage = async () => {
    if (!message.trim() || chatMutation.isPending) return

    const userMessage: Message = {
      id: generateId(),
      content: message.trim(),
      role: "user",
      timestamp: new Date()
    }

    // Hedef session'ı belirle (varsa mevcut, yoksa yeni oluşturulacak)
    let targetSessionId = activeSessionId as string | null

    if (activeSessionId) {
      // Mevcut session'a mesaj ekle
      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              lastMessage: new Date()
            }
          : session
      ))
    } else {
      // Yeni session oluştur
      const newSession: ChatSession = {
        id: generateId(),
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        messages: [userMessage],
        lastMessage: new Date()
      }
      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      targetSessionId = newSession.id
    }

    setMessage("")

    // useMutation ile API'ye mesaj gönder
    // Send the message to the API using useMutation
    chatMutation.mutate(userMessage.content, {
      onSuccess: (data) => {
        // onSuccess: Backend'den başarılı yanıt geldiğinde çalışır.
        // onSuccess: Runs when the backend returns a successful response.
        const aiText = (data as any)?.content ?? (data as any)?.message ?? ""

        const aiMessage: Message = {
          id: generateId(),
          content: aiText,
          role: "assistant",
          timestamp: new Date()
        }

        setSessions(prev => prev.map(session =>
          session.id === (targetSessionId || prev[0]?.id)
            ? {
                ...session,
                messages: [...session.messages, aiMessage],
                lastMessage: new Date()
              }
            : session
        ))
      },
      onError: (err: any) => {
        // onError: İstek hata ile sonuçlandığında çalışır.
        // onError: Triggered when the request fails.
        toast.error(err?.message || 'AI isteği başarısız oldu')
      }
    })
  }

  // Legacy mock yanıt fonksiyonu kaldırıldı

  const createNewChat = () => {
    setActiveSessionId(null)
    setMessage("")
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Mesaj kopyalandı")
  }

  const deleteSession = (sessionId: string) => {
    // Boş ekran hatasını önlemek için silme sonrası aktif oturumu, yeni listeye göre güvenli şekilde güncelle.
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId)
      if (activeSessionId === sessionId) {
        setActiveSessionId(next[0]?.id || null)
      }
      return next
    })
    toast.success("Sohbet silindi")
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sol panel - Sohbet geçmişi */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-80 border-r border-border bg-card/50 flex flex-col"
      >
        {/* Sağlayıcı seçimi + Yeni sohbet */}
        <div className="p-4 border-b border-border space-y-2">
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Sağlayıcı / Provider</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {/* Model seçimi (LM Studio için) */}
          <div>
            <label className="block text-xs mb-1 text-muted-foreground">Model</label>
            <Combobox.Root
              // Ark UI Combobox controlled value dizi bekler / expects string[]
              // Tip uyuşmazlıklarını önlemek için minimal collection prop eklenmiştir.
              // Provide a minimal collection to satisfy type requirements.
              collection={{ items: LMSTUDIO_MODELS.map(m => ({ id: m.name, label: m.name })) } as any}
              value={[modelName || '']}
              onValueChange={({ value }) => setModelName(value[0] || '')}
              positioning={{ sameWidth: true }}
            >
              <Combobox.Control className="w-full">
                <Combobox.Input
                  placeholder={(import.meta as any).env?.VITE_LMSTUDIO_MODEL || 'deepseek-coder-v2-lite-instruct'}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                />
              </Combobox.Control>
              {provider === 'lmstudio' && (
                <Combobox.Positioner>
                  <Combobox.Content className="z-50 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
                    <Combobox.ItemGroup id="lmstudio">
                      <Combobox.ItemGroupLabel className="px-2 py-1 text-xs text-muted-foreground">Yüklü Modeller</Combobox.ItemGroupLabel>
                      {LMSTUDIO_MODELS.map((m) => (
                        <Combobox.Item key={m.name} item={m.name} className="px-3 py-2 text-sm hover:bg-muted">
                          <div className="font-mono">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.note}</div>
                        </Combobox.Item>
                      ))}
                    </Combobox.ItemGroup>
                  </Combobox.Content>
                </Combobox.Positioner>
              )}
            </Combobox.Root>
          </div>
          <Button
            onClick={createNewChat}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Sohbet
          </Button>
        </div>

        {/* Sohbet listesi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors mb-2 group",
                activeSessionId === session.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{session.title}</p>
                  <p className="text-xs opacity-70 truncate">
                    {formatRelativeTime(session.lastMessage)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sağ panel - Aktif sohbet */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Mesaj alanı */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <AnimatePresence>
                {/* Boş ekran hatasını önlemek için 'activeSession' ve 'messages' kontrol edildi. */}
                {(activeSession?.messages ?? []).map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={copyMessage}
                  />
                ))}
              </AnimatePresence>

              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-4"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="flex-1 max-w-3xl">
                    <CardContent className="p-4 flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-muted-foreground">
                        AI düşünüyor...
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj girişi */}
            <div className="border-t border-border p-6">
              <div className="flex space-x-4">
                <Input
                  placeholder="Mesajınızı yazın..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                  disabled={chatMutation.isPending}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || chatMutation.isPending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <ChatEmptyState onStartChat={createNewChat} />
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  onCopy: (content: string) => void
}

function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start space-x-4 group",
        isUser && "flex-row-reverse space-x-reverse"
      )}
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col space-y-2 max-w-3xl", isUser && "items-end")}>
        <Card className={cn(
          "relative",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted/50"
        )}>
          <CardContent className="p-4">
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
          </CardContent>

          {/* Mesaj işlemleri */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Tooltip content="Kopyala">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onCopy(message.content)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground px-2">
          {formatRelativeTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  )
}
