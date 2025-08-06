// Ana uygulama bileşeni - Router, layout ve tour yönetimi
import * as React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { WelcomeTour } from "@/components/welcome-tour"
import { Dashboard } from "@/pages/dashboard"
import { Chat } from "@/pages/chat"
import { Search } from "@/pages/search"
import { useTheme } from "@/hooks/use-theme"

// Lazy loading ile performans optimizasyonu
const Models = React.lazy(() => import("@/pages/models").then(m => ({ default: m.Models })))
const Profile = React.lazy(() => import("@/pages/profile").then(m => ({ default: m.Profile })))
const Settings = React.lazy(() => import("@/pages/settings").then(m => ({ default: m.Settings })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      retry: 1,
    },
  },
})

function App() {
  const { theme } = useTheme()
  const [showTour, setShowTour] = React.useState(false)

  React.useEffect(() => {
    // İlk ziyaret kontrolü
    const hasSeenTour = localStorage.getItem("hasSeenTour")
    if (!hasSeenTour) {
      // Sayfa yüklendikten sonra tour'u başlat
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleTourComplete = () => {
    setShowTour(false)
    localStorage.setItem("hasSeenTour", "true")
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen ${theme}`}>
          <MainLayout>
            <React.Suspense 
              fallback={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Sayfa yükleniyor...</p>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/search" element={<Search />} />
                <Route path="/models" element={<Models />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route 
                  path="*" 
                  element={
                    <div className="text-center py-12">
                      <h1 className="text-2xl font-bold text-muted-foreground">404 - Sayfa Bulunamadı</h1>
                      <p className="mt-2 text-muted-foreground">Aradığınız sayfa mevcut değil.</p>
                    </div>
                  } 
                />
              </Routes>
            </React.Suspense>
          </MainLayout>

          <WelcomeTour 
            isOpen={showTour} 
            onClose={handleTourComplete} 
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
