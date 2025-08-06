// Ayarlar sayfası - Sistem tercihleri ve uygulama konfigürasyonu
import * as React from "react"
import { motion } from "framer-motion"
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  HelpCircle,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/hooks/use-theme"
import { Tooltip } from "@/components/ui/tooltip"
import toast from "react-hot-toast"

function Settings() {
  const { theme, setTheme, isDark } = useTheme()
  const [apiKey, setApiKey] = React.useState("")
  const [showApiKey, setShowApiKey] = React.useState(false)

  const handleExportData = () => {
    toast.success("Veriler dışa aktarılıyor...")
  }

  const handleClearCache = () => {
    localStorage.clear()
    toast.success("Önbellek temizlendi")
  }

  const handleResetSettings = () => {
    if (confirm("Tüm ayarları sıfırlamak istediğinizden emin misiniz?")) {
      toast.success("Ayarlar sıfırlandı")
    }
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
        <h1 className="text-4xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground text-lg">
          Uygulama tercihlerinizi ve sistem ayarlarınızı yönetin.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Görünüm ayarları */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Görünüm</span>
              </CardTitle>
              <CardDescription>
                Arayüz teması ve görünüm ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingRow
                label="Tema"
                description="Açık veya koyu tema seçin"
                control={
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                    >
                      Açık
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                    >
                      Koyu
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                    >
                      Sistem
                    </Button>
                  </div>
                }
              />

              <SettingRow
                label="Animasyonlar"
                description="Sayfa geçişleri ve efektler"
                control={
                  <Button variant="outline" size="sm">
                    Etkin
                  </Button>
                }
              />

              <SettingRow
                label="Sidebar"
                description="Yan menü varsayılan durumu"
                control={
                  <Button variant="outline" size="sm">
                    Genişletilmiş
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Bildirim ayarları */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Bildirimler</span>
              </CardTitle>
              <CardDescription>
                Bildirim tercihleri ve uyarılar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingRow
                label="Masaüstü Bildirimleri"
                description="Yeni mesajlar için bildirim göster"
                control={
                  <Button variant="outline" size="sm">
                    Etkin
                  </Button>
                }
              />

              <SettingRow
                label="E-posta Bildirimleri"
                description="Önemli güncellemeler için e-posta"
                control={
                  <Button variant="outline" size="sm">
                    Etkin
                  </Button>
                }
              />

              <SettingRow
                label="Ses Bildirimleri"
                description="Mesaj alındığında ses çal"
                control={
                  <Button variant="outline" size="sm">
                    Kapalı
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* API ayarları */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>API Ayarları</span>
              </CardTitle>
              <CardDescription>
                AI modelleri için API anahtarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">OpenAI API Anahtarı</label>
                <div className="flex space-x-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Gizle" : "Göster"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API anahtarınız güvenli şekilde saklanır ve hiçbir zaman paylaşılmaz.
                </p>
              </div>

              <SettingRow
                label="Model Sağlayıcısı"
                description="Varsayılan AI modeli sağlayıcısı"
                control={
                  <Button variant="outline" size="sm">
                    OpenAI
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Gizlilik ve güvenlik */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Gizlilik ve Güvenlik</span>
              </CardTitle>
              <CardDescription>
                Veri güvenliği ve gizlilik ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingRow
                label="Sohbet Geçmişi"
                description="Sohbetleri yerel olarak sakla"
                control={
                  <Button variant="outline" size="sm">
                    Etkin
                  </Button>
                }
              />

              <SettingRow
                label="Analitik"
                description="Anonim kullanım verilerini paylaş"
                control={
                  <Button variant="outline" size="sm">
                    Etkin
                  </Button>
                }
              />

              <SettingRow
                label="Otomatik Oturum Kapatma"
                description="Hareketsizlik sonrası oturumu kapat"
                control={
                  <Button variant="outline" size="sm">
                    30 dakika
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Dil ve bölge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Dil ve Bölge</span>
              </CardTitle>
              <CardDescription>
                Dil ve bölgesel ayarlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingRow
                label="Arayüz Dili"
                description="Uygulamanın görüntüleneceği dil"
                control={
                  <Button variant="outline" size="sm">
                    Türkçe
                  </Button>
                }
              />

              <SettingRow
                label="Tarih Formatı"
                description="Tarihlerin görüntülenme şekli"
                control={
                  <Button variant="outline" size="sm">
                    GG.AA.YYYY
                  </Button>
                }
              />

              <SettingRow
                label="Saat Dilimi"
                description="Zaman damgaları için saat dilimi"
                control={
                  <Button variant="outline" size="sm">
                    UTC+3
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Veri yönetimi */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Veri Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Verilerinizi yönetin ve dışa aktarın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tooltip content="Sohbet geçmişinizi ve ayarlarınızı JSON formatında indir">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportData}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Verilerimi Dışa Aktar
                </Button>
              </Tooltip>

              <Tooltip content="Önbelleği ve geçici dosyaları temizle">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClearCache}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Önbelleği Temizle
                </Button>
              </Tooltip>

              <Tooltip content="Tüm ayarları fabrika ayarlarına döndür">
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleResetSettings}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ayarları Sıfırla
                </Button>
              </Tooltip>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Yardım ve destek */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>Yardım ve Destek</span>
            </CardTitle>
            <CardDescription>
              Kullanım kılavuzu ve destek seçenekleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <HelpCircle className="w-6 h-6" />
                <span>Kullanım Kılavuzu</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <SettingsIcon className="w-6 h-6" />
                <span>Hoş Geldin Turu</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Bell className="w-6 h-6" />
                <span>Destek Talebi</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

interface SettingRowProps {
  label: string
  description: string
  control: React.ReactNode
}

function SettingRow({ label, description, control }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-1">
        <h4 className="font-medium">{label}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="ml-4">
        {control}
      </div>
    </div>
  )
}

export default Settings
