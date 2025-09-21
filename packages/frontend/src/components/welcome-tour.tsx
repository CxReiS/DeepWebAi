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

// Hoş geldin turu bileşeni - Yeni kullanıcılar için interaktif rehber
import * as React from "react"
import Joyride, { 
  CallBackProps, 
  STATUS, 
  Step,
  Styles
} from "react-joyride"
import { useTheme } from "@/hooks/use-theme"

interface WelcomeTourProps {
  isOpen: boolean
  onClose: () => void
}

const tourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">DeepWebAI'ye Hoş Geldiniz! 🎉</h2>
        <p>Size platform özelliklerini tanıtmak istiyoruz. Rehbere başlayalım!</p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">Navigasyon Menüsü</h3>
        <p>Sol menüden tüm sayfalara erişebilirsiniz. Dashboard, Arama, Sohbet ve daha fazlası!</p>
        <p className="text-sm text-muted-foreground">💡 Menüyü daraltmak için üst kısımdaki butonu kullanabilirsiniz.</p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="search"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">Hızlı Arama</h3>
        <p>Üst kısımdaki arama çubuğu ile hızlıca arama yapabilirsiniz.</p>
        <p className="text-sm text-muted-foreground">🔍 AI destekli arama için detaylı arama sayfasını kullanın.</p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">Tema Değiştirici</h3>
        <p>Koyu ve açık tema arasında geçiş yapabilirsiniz.</p>
        <p className="text-sm text-muted-foreground">🌙 Gözlerinizi yormaması için koyu temayı öneriyoruz!</p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="user-menu"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">Kullanıcı Menüsü</h3>
        <p>Profil ayarlarınıza ve hesap seçeneklerinize buradan erişebilirsiniz.</p>
      </div>
    ),
    placement: "bottom-end",
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">İstatistikler</h3>
        <p>Kullanım istatistiklerinizi ve genel durumunuzu buradan takip edebilirsiniz.</p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="quick-actions"]',
    content: (
      <div className="space-y-3">
        <h3 className="font-semibold">Hızlı Eylemler</h3>
        <p>En çok kullanılan özellikler için kısayollar. Sohbet başlatın, arama yapın veya modelleri inceleyin!</p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "body",
    content: (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">Rehber Tamamlandı! ✨</h2>
        <p>Artık DeepWebAI'yi kullanmaya hazırsınız. İyi keşifler!</p>
        <p className="text-sm text-muted-foreground">Bu rehberi tekrar görmek için Ayarlar → Yardım menüsünden ulaşabilirsiniz.</p>
      </div>
    ),
    placement: "center",
  },
]

export function WelcomeTour({ isOpen, onClose }: WelcomeTourProps) {
  const { isDark } = useTheme()

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data // 'type' kullanılmıyor

    // STATUS karşılaştırmasını includes yerine açık karşılaştırma ile yapıyoruz
    // Use explicit comparisons to avoid union type issues
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose()
    }
  }

  // Joyride Styles tipinde tüm alanlar zorunlu; burada kısmi bir stil nesnesi kullandığımız için
  // Partial<Styles> + as Styles ile tip dönüşümü yapıyoruz.
  // Joyride expects a full Styles object; we provide a partial and cast for flexibility.
  const joyrideStyles = {
    options: {
      primaryColor: isDark ? "#ffffff" : "#000000",
      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
      textColor: isDark ? "#ffffff" : "#000000",
      overlayColor: "rgba(0, 0, 0, 0.4)",
      arrowColor: isDark ? "#1a1a1a" : "#ffffff",
      zIndex: 1000,
    },
    tooltip: {
      borderRadius: "12px",
      padding: "20px",
      fontSize: "14px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
    },
    tooltipContainer: {
      textAlign: "left",
    },
    tooltipTitle: {
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
    },
    tooltipContent: {
      lineHeight: "1.5",
    },
    buttonNext: {
      backgroundColor: isDark ? "#ffffff" : "#000000",
      color: isDark ? "#000000" : "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    buttonBack: {
      backgroundColor: "transparent",
      color: isDark ? "#9ca3af" : "#6b7280",
      border: `1px solid ${isDark ? "#374151" : "#d1d5db"}`,
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      marginRight: "8px",
      transition: "all 0.2s ease",
    },
    buttonSkip: {
      backgroundColor: "transparent",
      color: isDark ? "#9ca3af" : "#6b7280",
      border: "none",
      fontSize: "14px",
      cursor: "pointer",
      marginRight: "auto",
    },
    spotlight: {
      borderRadius: "8px",
    },
    beacon: {
      borderRadius: "50%",
    },
  } as Styles

  React.useEffect(() => {
    // Rehber açıldığında sayfa tour attr'larını ekle
    if (isOpen) {
      const addTourAttributes = () => {
        // Sidebar
        const sidebar = document.querySelector('[data-testid="sidebar"]') || 
                      document.querySelector('nav') ||
                      document.querySelector('[class*="sidebar"]')
        if (sidebar) sidebar.setAttribute('data-tour', 'sidebar')

        // Search input
        const searchInput = document.querySelector('input[placeholder*="Arama"]') ||
                           document.querySelector('input[placeholder*="arama"]')
        if (searchInput) searchInput.setAttribute('data-tour', 'search')

        // Theme toggle
        const themeToggle = document.querySelector('[aria-label*="tema"]') ||
                           document.querySelector('button[class*="theme"]') ||
                           document.querySelectorAll('button')[1] // Header'daki ikinci buton genelde tema toggle
        if (themeToggle) themeToggle.setAttribute('data-tour', 'theme-toggle')

        // User menu
        const userMenu = document.querySelector('[class*="avatar"]')?.parentElement ||
                        document.querySelector('button:last-of-type')
        if (userMenu) userMenu.setAttribute('data-tour', 'user-menu')

        // Dashboard stats
        const statsGrid = document.querySelector('[class*="grid"]')
        if (statsGrid) statsGrid.setAttribute('data-tour', 'dashboard-stats')

        // Quick actions
        const quickActions = document.querySelector('[class*="quick"]') ||
                             document.querySelectorAll('[class*="grid"]')[1]
        if (quickActions) quickActions.setAttribute('data-tour', 'quick-actions')
      }

      // DOM elementlerin yüklenmesi için kısa bir gecikme
      const timer = setTimeout(addTourAttributes, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Joyride
      steps={tourSteps}
      run={isOpen}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: "Geri",
        close: "Kapat",
        last: "Bitir",
        next: "İleri",
        skip: "Atla",
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  )
}
