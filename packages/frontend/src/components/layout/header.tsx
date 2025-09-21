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

// Üst menü bileşeni - Kullanıcı avatarı, tema değiştirici ve ayarlar menüsü
import * as React from "react"
import { motion } from "framer-motion"
import { 
  Sun, 
  Moon, 
  Settings, 
  LogOut, 
  User,
  Bell,
  Search
} from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/Input"
import { Tooltip } from "@/components/ui/Tooltip"
import { cn } from "@/lib/utils"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { setTheme, isDark } = useTheme()
  const [searchValue, setSearchValue] = React.useState("")
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Sol taraf - Arama */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Arama yapın..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-muted/50 border-muted focus:bg-background transition-colors"
              data-tour="search"
            />
          </div>
        </div>

        {/* Sağ taraf - Kullanıcı kontrolleri */}
        <div className="flex items-center space-x-2">
          {/* Bildirimler */}
          <Tooltip content="Bildirimler">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </Button>
          </Tooltip>

          {/* Tema değiştirici */}
          <Tooltip content={isDark ? "Açık temaya geç" : "Koyu temaya geç"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative overflow-hidden"
              data-tour="theme-toggle"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </Button>
          </Tooltip>

          {/* Kullanıcı menüsü */}
          <div className="relative">
            <Tooltip content="Kullanıcı menüsü">
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                onClick={() => setShowUserMenu(!showUserMenu)}
                data-tour="user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Kullanıcı" />
                  <AvatarFallback>KU</AvatarFallback>
                </Avatar>
              </Button>
            </Tooltip>

            {/* Dropdown menü */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-2 z-50"
                onBlur={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium">Kullanıcı Adı</p>
                  <p className="text-xs text-muted-foreground">kullanici@email.com</p>
                </div>
                
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Ayarlar
                  </Button>
                  
                  <hr className="my-1 border-border" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-sm text-destructive hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
