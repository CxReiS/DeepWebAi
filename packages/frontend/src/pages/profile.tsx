// Profil sayfası - Kullanıcı bilgileri ve hesap ayarları
import * as React from "react"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Edit, Save, X, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  joinDate: Date
  lastActive: Date
  stats: {
    totalChats: number
    totalSearches: number
    totalTokens: number
  }
  preferences: {
    theme: string
    language: string
    notifications: boolean
  }
}

const mockProfile: UserProfile = {
  id: "user-1",
  name: "Ahmet Yılmaz",
  email: "ahmet.yilmaz@email.com",
  joinDate: new Date("2024-01-15"),
  lastActive: new Date(),
  stats: {
    totalChats: 127,
    totalSearches: 89,
    totalTokens: 125000
  },
  preferences: {
    theme: "dark",
    language: "tr",
    notifications: true
  }
}

export function Profile() {
  const [profile, setProfile] = React.useState<UserProfile>(mockProfile)
  const [editing, setEditing] = React.useState(false)
  const [tempName, setTempName] = React.useState(profile.name)
  const [loading, setLoading] = React.useState(false)

  const handleSave = async () => {
    setLoading(true)
    
    // Simüle edilmiş kaydetme
    setTimeout(() => {
      setProfile(prev => ({ ...prev, name: tempName }))
      setEditing(false)
      setLoading(false)
      toast.success("Profil güncellendi")
    }, 1000)
  }

  const handleCancel = () => {
    setTempName(profile.name)
    setEditing(false)
  }

  const handleAvatarUpload = () => {
    toast.success("Avatar yükleme özelliği yakında eklenecek")
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
        <h1 className="text-4xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-lg">
          Hesap bilgilerinizi ve tercihlerinizi yönetin.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol taraf - Profil kartı */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Tooltip content="Avatar değiştir">
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleAvatarUpload}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* İsim düzenleme */}
              <div className="space-y-2">
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="İsim"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={loading || !tempName.trim()}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{profile.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {profile.email}
                      </p>
                    </div>
                    <Tooltip content="Düzenle">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditing(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </div>

              {/* Hesap bilgileri */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Katılım: {formatDate(profile.joinDate)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-2" />
                  Son aktif: {formatDate(profile.lastActive)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sağ taraf - İstatistikler ve ayarlar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* İstatistikler */}
          <Card>
            <CardHeader>
              <CardTitle>Kullanım İstatistikleri</CardTitle>
              <CardDescription>
                Platform üzerindeki aktiviteleriniz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Toplam Sohbet"
                  value={profile.stats.totalChats}
                  icon="💬"
                />
                <StatCard
                  title="Arama Sayısı"
                  value={profile.stats.totalSearches}
                  icon="🔍"
                />
                <StatCard
                  title="Kullanılan Token"
                  value={`${(profile.stats.totalTokens / 1000).toFixed(1)}K`}
                  icon="🎯"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tercihler */}
          <Card>
            <CardHeader>
              <CardTitle>Tercihler</CardTitle>
              <CardDescription>
                Hesap ve uygulama tercihlerinizi yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PreferenceRow
                label="Tema"
                description="Arayüz teması"
                value={profile.preferences.theme === "dark" ? "Koyu" : "Açık"}
                action={
                  <Button variant="outline" size="sm">
                    Değiştir
                  </Button>
                }
              />
              
              <PreferenceRow
                label="Dil"
                description="Arayüz dili"
                value="Türkçe"
                action={
                  <Button variant="outline" size="sm">
                    Değiştir
                  </Button>
                }
              />
              
              <PreferenceRow
                label="Bildirimler"
                description="E-posta bildirimleri"
                value={profile.preferences.notifications ? "Aktif" : "Pasif"}
                action={
                  <Button variant="outline" size="sm">
                    {profile.preferences.notifications ? "Kapat" : "Aç"}
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Hesap güvenliği */}
          <Card>
            <CardHeader>
              <CardTitle>Hesap Güvenliği</CardTitle>
              <CardDescription>
                Güvenlik ayarlarınızı yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Şifre</h4>
                  <p className="text-sm text-muted-foreground">
                    Son değiştirme: 2 ay önce
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Şifre Değiştir
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">İki Faktörlü Kimlik Doğrulama</h4>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızı daha güvenli hale getirin
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Etkinleştir
                </Button>
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
  icon: string
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/50">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  )
}

interface PreferenceRowProps {
  label: string
  description: string
  value: string
  action: React.ReactNode
}

function PreferenceRow({ label, description, value, action }: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-1">
        <h4 className="font-medium">{label}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">{value}</span>
        {action}
      </div>
    </div>
  )
}
