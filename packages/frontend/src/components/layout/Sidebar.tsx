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

// Yan menü bileşeni - Glass efektli responsive navigasyon menüsü
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Home, 
  Search, 
  MessageSquare, 
  Settings, 
  Menu,
  X,
  Bot,
  User,
  ChevronRight
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  {
    icon: Home,
    label: "Dashboard",
    href: "/",
    description: "Ana sayfa ve genel bakış"
  },
  {
    icon: Search,
    label: "Arama",
    href: "/search",
    description: "AI destekli akıllı arama"
  },
  {
    icon: MessageSquare,
    label: "Sohbet",
    href: "/chat",
    description: "AI asistanı ile sohbet"
  },
  {
    icon: Bot,
    label: "AI Modelleri",
    href: "/models",
    description: "Kullanılabilir AI modelleri"
  },
  {
    icon: User,
    label: "Profil",
    href: "/profile",
    description: "Kullanıcı profili ve ayarları"
  },
  {
    icon: Settings,
    label: "Ayarlar",
    href: "/settings",
    description: "Uygulama ayarları"
  }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  const sidebarVariants = {
    expanded: { width: "280px" },
    collapsed: { width: "80px" }
  }

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  }

  return (
    <motion.div
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative h-full bg-background/95 backdrop-blur-md border-r border-border glass"
      data-tour="sidebar"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={contentVariants}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">DeepWebAI</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Tooltip content={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </Tooltip>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 custom-scrollbar overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            return (
              <Tooltip 
                key={item.href}
                content={collapsed ? item.description : ""}
                side="right"
              >
                <Link to={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.div
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          variants={contentVariants}
                          transition={{ duration: 0.2 }}
                          className="flex-1 flex items-center justify-between"
                        >
                          <span className="font-medium">{item.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4" />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={contentVariants}
                transition={{ duration: 0.2 }}
                className="text-xs text-muted-foreground text-center"
              >
                <p>v1.0.0</p>
                <p>© 2024 DeepWebAI</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
