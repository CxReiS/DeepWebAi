// Boş durum bileşeni - Veri olmadığında gösterilecek animasyonlu placeholder
import * as React from "react"
import { motion } from "framer-motion"
import { Search, MessageSquare, FileX, Wifi } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  type?: "search" | "chat" | "file" | "connection" | "custom"
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

const iconMap = {
  search: Search,
  chat: MessageSquare,
  file: FileX,
  connection: Wifi,
}

export function EmptyState({
  type = "custom",
  title,
  description,
  action,
  icon,
  className
}: EmptyStateProps) {
  const IconComponent = type !== "custom" ? iconMap[type] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col items-center justify-center text-center space-y-6 py-12 px-4",
        className
      )}
    >
      <motion.div
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50"
      >
        {icon ? icon : IconComponent && (
          <IconComponent className="w-8 h-8 text-muted-foreground" />
        )}
      </motion.div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export function SearchEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      type="search"
      title="Sonuç bulunamadı"
      description="Arama kriterlerinizi değiştirmeyi deneyin veya farklı anahtar kelimeler kullanın."
      action={onReset ? {
        label: "Aramayı temizle",
        onClick: onReset
      } : undefined}
    />
  )
}

export function ChatEmptyState({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      type="chat"
      title="Henüz sohbet yok"
      description="AI asistanı ile sohbete başlamak için bir mesaj yazın."
      action={onStartChat ? {
        label: "Sohbet başlat",
        onClick: onStartChat
      } : undefined}
    />
  )
}
