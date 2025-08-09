// Arama sayfası - AI destekli akıllı arama arayüzü
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search as SearchIcon, 
  Filter, 
  SortDesc,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner, LoadingGrid } from "@/components/ui/loading-spinner"
import { SearchEmptyState } from "@/components/ui/empty-state"
import { Tooltip } from "@/components/ui/tooltip"
import { cn, formatRelativeTime, debounce } from "@/lib/utils"
import toast from "react-hot-toast"

interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  domain: string
  timestamp: Date
  tags: string[]
  relevanceScore: number
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "React 19 Yenilikleri ve Önemli Değişiklikler",
    description: "React 19 ile gelen yeni özellikler, hooks güncellemeleri ve breaking changes hakkında detaylı bilgi.",
    url: "https://react.dev/blog/react-19",
    domain: "react.dev",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    tags: ["React", "JavaScript", "Web Development"],
    relevanceScore: 0.95
  },
  {
    id: "2", 
    title: "TypeScript 5.5 ile Gelen Yenilikler",
    description: "TypeScript 5.5 sürümünde eklenen type inference iyileştirmeleri ve performans güncellemeleri.",
    url: "https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/",
    domain: "microsoft.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    tags: ["TypeScript", "Programming", "Microsoft"],
    relevanceScore: 0.87
  },
  {
    id: "3",
    title: "Tailwind CSS ile Modern UI Tasarımı",
    description: "Utility-first CSS framework olan Tailwind CSS kullanarak responsive ve modern web arayüzleri tasarlama rehberi.",
    url: "https://tailwindcss.com/docs",
    domain: "tailwindcss.com", 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    tags: ["CSS", "Design", "Frontend"],
    relevanceScore: 0.82
  },
  {
    id: "4",
    title: "Framer Motion ile React Animasyonları",
    description: "React uygulamalarında profesyonel animasyonlar oluşturmak için Framer Motion kütüphanesinin kullanımı.",
    url: "https://www.framer.com/motion/",
    domain: "framer.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ["Animation", "React", "UI/UX"],
    relevanceScore: 0.79
  }
]

export function Search() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        performSearch(searchQuery)
      }
    }, 500),
    []
  )

  React.useEffect(() => {
    if (query.trim()) {
      setLoading(true)
      debouncedSearch(query)
    } else {
      setResults([])
      setHasSearched(false)
    }
  }, [query, debouncedSearch])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    setHasSearched(true)

    // Simüle edilmiş arama gecikmesi
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock arama sonuçlarını filtrele
    const filteredResults = mockResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    setResults(filteredResults)
    setLoading(false)
  }

  const handleBookmark = (result: SearchResult) => {
    toast.success(`"${result.title}" favorilere eklendi`)
  }

  const handleShare = (result: SearchResult) => {
    if (navigator.share) {
      navigator.share({
        title: result.title,
        text: result.description,
        url: result.url
      })
    } else {
      navigator.clipboard.writeText(result.url)
      toast.success("Link kopyalandı")
    }
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight">AI Destekli Arama</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Gelişmiş algoritmaları ile istediğiniz bilgileri hızlı ve doğru şekilde bulun.
        </p>
      </motion.div>

      {/* Arama alanı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="p-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Ne aramak istiyorsunuz?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 focus:border-primary transition-colors"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Arama filtreleri */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtreler
              </Button>
              <Button variant="outline" size="sm">
                <SortDesc className="w-4 h-4 mr-2" />
                Sırala
              </Button>
            </div>
            
            {hasSearched && (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Temizle
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Arama sonuçları */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingGrid count={4} />
            </motion.div>
          ) : hasSearched && results.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchEmptyState onReset={clearSearch} />
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {results.length} sonuç bulundu
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Sıralama:</span>
                  <Button variant="outline" size="sm">
                    Alakalılık
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {results.map((result, index) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    index={index}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface SearchResultCardProps {
  result: SearchResult
  index: number
  onBookmark: (result: SearchResult) => void
  onShare: (result: SearchResult) => void
}

function SearchResultCard({ result, index, onBookmark, onShare }: SearchResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="group hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg hover:text-primary cursor-pointer transition-colors">
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    {result.title}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </CardTitle>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded-full">
                    {(result.relevanceScore * 100).toFixed(0)}% eşleşme
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>{result.domain}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(result.timestamp)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content="Favorilere ekle">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onBookmark(result)}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </Tooltip>
              
              <Tooltip content="Paylaş">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onShare(result)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="text-sm leading-relaxed mb-3">
            {result.description}
          </CardDescription>

          <div className="flex items-center space-x-2">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {result.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
