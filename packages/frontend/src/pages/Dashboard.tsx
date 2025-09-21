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

// Dashboard ana sayfa - Grid tabanlı kartlar ve genel bakış widget'ları
import * as React from "react"
import { motion } from "framer-motion"
import { 
  MessageSquare, 
  Search, 
  Bot, 
  TrendingUp, 
  Activity,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatRelativeTime } from "@/lib/utils"

interface DashboardStats {
  totalChats: number
  totalSearches: number
  activeModels: number
  lastActivity: Date
}

const mockStats: DashboardStats = {
  totalChats: 127,
  totalSearches: 89,
  activeModels: 4,
  lastActivity: new Date(Date.now() - 1000 * 60 * 15) // 15 dakika önce
}

const recentActivities = [
  { id: 1, type: "chat", title: "AI ile yazılım geliştirme sohbeti", time: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 2, type: "search", title: "React best practices araması", time: new Date(Date.now() - 1000 * 60 * 12) },
  { id: 3, type: "model", title: "GPT-4 modeli aktif edildi", time: new Date(Date.now() - 1000 * 60 * 25) },
  { id: 4, type: "chat", title: "Veritabanı optimizasyonu", time: new Date(Date.now() - 1000 * 60 * 45) },
]

const quickActions = [
  {
    icon: MessageSquare,
    label: "Yeni Sohbet",
    description: "AI asistanı ile sohbete başla",
    href: "/chat",
    color: "text-blue-500"
  },
  {
    icon: Search,
    label: "Akıllı Arama",
    description: "AI destekli arama yap",
    href: "/search",
    color: "text-green-500"
  },
  {
    icon: Bot,
    label: "Model Yönetimi",
    description: "AI modellerini yönet",
    href: "/models",
    color: "text-purple-500"
  }
]

export function Dashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simüle edilmiş veri yükleme
    const timer = setTimeout(() => {
      setStats(mockStats)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
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
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          DeepWebAI platformuna hoş geldiniz. İşte güncel durumunuz.
        </p>
      </motion.div>

      {/* İstatistik kartları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        data-tour="dashboard-stats"
      >
        <StatCard
          title="Toplam Sohbet"
          value={stats?.totalChats || 0}
          icon={MessageSquare}
          color="text-blue-500"
          change="+12%"
        />
        <StatCard
          title="Arama Sayısı"
          value={stats?.totalSearches || 0}
          icon={Search}
          color="text-green-500"
          change="+8%"
        />
        <StatCard
          title="Aktif Modeller"
          value={stats?.activeModels || 0}
          icon={Bot}
          color="text-purple-500"
          change="=0%"
        />
        <StatCard
          title="Son Aktivite"
          value={formatRelativeTime(stats?.lastActivity || new Date())}
          icon={Clock}
          color="text-orange-500"
          isTime={true}
        />
      </motion.div>

      {/* Ana içerik grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hızlı eylemler */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
          data-tour="quick-actions"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Hızlı Eylemler</span>
              </CardTitle>
              <CardDescription>
                Sık kullanılan özellikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center space-y-3 w-full hover:shadow-md transition-shadow"
                      asChild
                    >
                      <a href={action.href}>
                        <action.icon className={`w-8 h-8 ${action.color}`} />
                        <div className="text-center">
                          <div className="font-semibold">{action.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Son aktiviteler */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Son Aktiviteler</span>
              </CardTitle>
              <CardDescription>
                Son işlemleriniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  change?: string
  isTime?: boolean
}

function StatCard({ title, value, icon: Icon, color, change, isTime }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold">
              {isTime ? value : typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
            </p>
            {change && !isTime && (
              <p className={`text-xs ${
                change.startsWith('+') ? 'text-green-500' : 
                change.startsWith('-') ? 'text-red-500' : 
                'text-muted-foreground'
              }`}>
                {change} geçen haftaya göre
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-muted/50 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
