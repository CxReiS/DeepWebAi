import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Home, Search, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ChatInterface } from '@/components/features/chat/ChatInterface'
import { Dashboard } from '@/components/features/dashboard/Dashboard'
import { cn } from '@/utils/cn'

interface MainLayoutProps {
  children?: React.ReactNode
}

type ViewType = 'dashboard' | 'chat' | 'search'

const navigationItems = [
  { icon: MessageCircle, label: 'New Chat', view: 'chat' as ViewType },
  { icon: Home, label: 'Dashboard', view: 'dashboard' as ViewType },
  { icon: Search, label: 'Search', view: 'search' as ViewType },
]

const suggestionCards = [
  { title: 'Code Review', description: 'Analyze and improve your code' },
  { title: 'Debug Issue', description: 'Help troubleshoot problems' },
  { title: 'Generate Code', description: 'Create new functionality' },
  { title: 'Explain Concept', description: 'Learn about technologies' },
]

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  const renderContent = () => {
    if (children) return children
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'chat':
        return <ChatInterface />
      case 'search':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Search Feature</h2>
              <p className="text-muted-foreground">Search functionality coming soon...</p>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        className="w-60 bg-card border-r border-border flex flex-col"
      >
        {/* Logo/Brand */}
        <div className="p-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <span className="font-semibold text-lg">DeepWebAI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  currentView === item.view
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Chat History */}
          <div className="mt-6">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Today
            </div>
            <div className="space-y-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                className="w-full px-4 py-2 text-sm text-left text-muted-foreground hover:bg-accent/30 rounded-md transition-colors duration-200 truncate"
              >
                Previous conversation...
              </motion.button>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">User</div>
              <div className="text-xs text-muted-foreground truncate">user@example.com</div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div className="flex items-center gap-3">
            <select className="bg-secondary border border-input rounded-lg px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <option>GPT-4o</option>
              <option>Claude-3.5</option>
              <option>Llama 3.2</option>
            </select>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer">
              U
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {currentView === 'chat' ? (
            renderContent()
          ) : (
            <div className="container-centered py-6">
              {renderContent()}
            </div>
          )}
        </main>


      </div>
    </div>
  )
}

export default MainLayout
