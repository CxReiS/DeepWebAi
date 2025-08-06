// AI modelleri sayfası - Kullanılabilir modellerin yönetimi ve seçimi
import * as React from "react"
import { motion } from "framer-motion"
import { Bot, Zap, Settings, Play, Pause, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface AIModel {
  id: string
  name: string
  description: string
  provider: string
  status: "active" | "inactive" | "loading"
  capabilities: string[]
  performance: {
    speed: number
    accuracy: number
    cost: number
  }
  usage: {
    requests: number
    tokens: number
  }
}

const mockModels: AIModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "En gelişmiş dil modeli. Karmaşık görevler ve yaratıcı içerik üretimi için ideal.",
    provider: "OpenAI",
    status: "active",
    capabilities: ["Metin üretimi", "Kod yazma", "Analiz", "Çeviri"],
    performance: { speed: 85, accuracy: 95, cost: 75 },
    usage: { requests: 1245, tokens: 125000 }
  },
  {
    id: "claude-3",
    name: "Claude 3",
    description: "Etik ve güvenli AI modeli. Uzun metinler ve detaylı analizler için mükemmel.",
    provider: "Anthropic",
    status: "active",
    capabilities: ["Metin analizi", "Özetleme", "Araştırma", "Güvenli sohbet"],
    performance: { speed: 80, accuracy: 92, cost: 60 },
    usage: { requests: 856, tokens: 95000 }
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Çok modlu AI sistemi. Metin, görsel ve kod analizi yapabilir.",
    provider: "Google",
    status: "inactive",
    capabilities: ["Multimodal", "Görsel analiz", "Kod optimizasyonu"],
    performance: { speed: 90, accuracy: 88, cost: 50 },
    usage: { requests: 423, tokens: 42000 }
  },
  {
    id: "llama-2",
    name: "Llama 2",
    description: "Açık kaynak dil modeli. Özelleştirilebilir ve maliyet etkin.",
    provider: "Meta",
    status: "loading",
    capabilities: ["Açık kaynak", "Özelleştirme", "Yerel çalıştırma"],
    performance: { speed: 70, accuracy: 85, cost: 30 },
    usage: { requests: 234, tokens: 28000 }
  }
]

export function Models() {
  const [models, setModels] = React.useState<AIModel[]>(mockModels)
  const [loading, setLoading] = React.useState(false)

  const toggleModel = async (modelId: string) => {
    setLoading(true)
    
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { 
            ...model, 
            status: model.status === "active" ? "loading" : "loading"
          }
        : model
    ))

    // Simülasyon
    setTimeout(() => {
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { 
              ...model, 
              status: model.status === "active" || model.status === "loading" ? "inactive" : "active"
            }
          : model
      ))
      setLoading(false)
      
      const model = models.find(m => m.id === modelId)
      const newStatus = model?.status === "active" ? "devreden çıkarıldı" : "aktif edildi"
      toast.success(`${model?.name} ${newStatus}`)
    }, 1500)
  }

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">AI Modelleri</h1>
        <p className="text-muted-foreground text-lg">
          Kullanılabilir AI modellerini yönetin ve performanslarını takip edin.
        </p>
      </motion.div>

      {/* Model kartları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {models.map((model, index) => (
          <ModelCard
            key={model.id}
            model={model}
            index={index}
            onToggle={toggleModel}
            disabled={loading}
          />
        ))}
      </motion.div>

      {/* Genel istatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Genel İstatistikler</CardTitle>
            <CardDescription>Tüm modellerin kullanım özeti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {models.filter(m => m.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Aktif Model</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {models.reduce((total, model) => total + model.usage.requests, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Toplam İstek</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {(models.reduce((total, model) => total + model.usage.tokens, 0) / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-muted-foreground">Toplam Token</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

interface ModelCardProps {
  model: AIModel
  index: number
  onToggle: (modelId: string) => void
  disabled: boolean
}

function ModelCard({ model, index, onToggle, disabled }: ModelCardProps) {
  const isActive = model.status === "active"
  const isLoading = model.status === "loading"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={cn(
        "relative transition-all duration-300",
        isActive && "ring-2 ring-primary/20 bg-primary/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Bot className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <CardTitle className="text-lg">{model.name}</CardTitle>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  isActive ? "bg-green-100 text-green-700" : 
                  isLoading ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                )}>
                  {isActive ? "Aktif" : isLoading ? "Yükleniyor" : "Pasif"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{model.provider}</p>
            </div>

            <div className="flex items-center space-x-1">
              <Tooltip content="Model bilgileri">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="w-4 h-4" />
                </Button>
              </Tooltip>
              
              <Button
                variant="ghost"
                size="icon" 
                className="h-8 w-8"
                onClick={() => onToggle(model.id)}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed">
            {model.description}
          </CardDescription>

          {/* Yetenekler */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Yetenekler</h4>
            <div className="flex flex-wrap gap-1">
              {model.capabilities.map((capability) => (
                <span
                  key={capability}
                  className="px-2 py-1 text-xs bg-muted rounded-md"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          {/* Performans metrikleri */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Performans</h4>
            <div className="space-y-2">
              <PerformanceBar label="Hız" value={model.performance.speed} color="blue" />
              <PerformanceBar label="Doğruluk" value={model.performance.accuracy} color="green" />
              <PerformanceBar label="Maliyet" value={model.performance.cost} color="red" inverted />
            </div>
          </div>

          {/* Kullanım istatistikleri */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-semibold">{model.usage.requests.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">İstek</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{(model.usage.tokens / 1000).toFixed(1)}K</div>
              <div className="text-xs text-muted-foreground">Token</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface PerformanceBarProps {
  label: string
  value: number
  color: "blue" | "green" | "red"
  inverted?: boolean
}

function PerformanceBar({ label, value, color, inverted }: PerformanceBarProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500", 
    red: "bg-red-500"
  }

  const displayValue = inverted ? 100 - value : value

  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs w-16">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClasses[color])}
          style={{ width: `${displayValue}%` }}
        />
      </div>
      <span className="text-xs w-10 text-right">{value}%</span>
    </div>
  )
}
