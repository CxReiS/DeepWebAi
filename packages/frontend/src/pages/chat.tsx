// Sohbet sayfası - AI asistanı ile gerçek zamanlı mesajlaşma arayüzü
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Bot, 
  User, 
  MoreVertical,
  Copy,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ChatEmptyState } from "@/components/ui/empty-state"
import { Tooltip } from "@/components/ui/tooltip"
import { cn, formatRelativeTime, generateId } from "@/lib/utils"
import toast from "react-hot-toast"

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
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      content: message.trim(),
      role: "user",
      timestamp: new Date()
    }

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
    }

    setMessage("")
    setIsLoading(true)

    // AI yanıtını simüle et
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        content: generateAIResponse(userMessage.content),
        role: "assistant",
        timestamp: new Date()
      }

      setSessions(prev => prev.map(session =>
        session.id === (activeSessionId || sessions[0]?.id)
          ? {
              ...session,
              messages: [...session.messages, aiMessage],
              lastMessage: new Date()
            }
          : session
      ))
      setIsLoading(false)
    }, 1500)
  }

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "Bu çok ilginç bir soru! Size detaylı bir açıklama yapabilirim.",
      "Anlıyorum. Bu konuda size yardımcı olmaktan memnuniyet duyarım.",
      "Harika bir yaklaşım! İşte benim önerilerim:",
      "Bu konuda birkaç farklı seçeneğiniz var. Hepsini açıklayayım:"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const createNewChat = () => {
    setActiveSessionId(null)
    setMessage("")
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Mesaj kopyalandı")
  }

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions[0]?.id || null)
    }
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
        {/* Yeni sohbet butonu */}
        <div className="p-4 border-b border-border">
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
                {activeSession.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={copyMessage}
                  />
                ))}
              </AnimatePresence>

              {isLoading && (
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
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || isLoading}
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
