// Dashboard bileşeni için test dosyası
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from '@/pages/dashboard'
import { describe, it, expect } from 'vitest'

const DashboardWrapper = () => (
  <BrowserRouter>
    <Dashboard />
  </BrowserRouter>
)

describe('Dashboard', () => {
  it('başlık ve açıklama metni doğru şekilde görüntülenir', () => {
    render(<DashboardWrapper />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/DeepWebAI platformuna hoş geldiniz/)).toBeInTheDocument()
  })

  it('yükleme durumunda spinner gösterilir', () => {
    render(<DashboardWrapper />)
    
    expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument()
  })

  it('istatistik kartları yüklendikten sonra görüntülenir', async () => {
    render(<DashboardWrapper />)
    
    await waitFor(() => {
      expect(screen.getByText('Toplam Sohbet')).toBeInTheDocument()
      expect(screen.getByText('Arama Sayısı')).toBeInTheDocument()
      expect(screen.getByText('Aktif Modeller')).toBeInTheDocument()
      expect(screen.getByText('Son Aktivite')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('hızlı eylem butonları doğru href değerleri ile render edilir', async () => {
    render(<DashboardWrapper />)
    
    await waitFor(() => {
      const chatButton = screen.getByRole('link', { name: /Yeni Sohbet/ })
      const searchButton = screen.getByRole('link', { name: /Akıllı Arama/ })
      const modelsButton = screen.getByRole('link', { name: /Model Yönetimi/ })
      
      expect(chatButton).toHaveAttribute('href', '/chat')
      expect(searchButton).toHaveAttribute('href', '/search')
      expect(modelsButton).toHaveAttribute('href', '/models')
    }, { timeout: 2000 })
  })

  it('son aktiviteler listesi görüntülenir', async () => {
    render(<DashboardWrapper />)
    
    await waitFor(() => {
      expect(screen.getByText('Son Aktiviteler')).toBeInTheDocument()
      expect(screen.getByText(/AI ile yazılım geliştirme/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
