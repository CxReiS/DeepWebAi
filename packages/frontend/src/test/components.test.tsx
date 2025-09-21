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

// UI bileşenleri için test dosyası
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { describe, it, expect, vi } from 'vitest'

describe('Button Bileşeni', () => {
  it('varsayılan button render edilir', () => {
    render(<Button>Test Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  it('farklı varyantlar doğru CSS sınıfları ile render edilir', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')
    
    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
    
    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
  })

  it('click eventi çalışır', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clickable</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled durumda tıklanamaz', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})

describe('Card Bileşeni', () => {
  it('card bileşenleri doğru şekilde render edilir', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Başlık</CardTitle>
        </CardHeader>
        <CardContent>Test İçerik</CardContent>
      </Card>
    )
    
    expect(screen.getByText('Test Başlık')).toBeInTheDocument()
    expect(screen.getByText('Test İçerik')).toBeInTheDocument()
  })

  it('card doğru CSS sınıfları ile render edilir', () => {
    render(
      <Card data-testid="test-card">
        <CardContent>Content</CardContent>
      </Card>
    )
    
    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm')
  })
})

describe('LoadingSpinner Bileşeni', () => {
  it('farklı boyutlarda spinner render edilir', () => {
    const { rerender } = render(<LoadingSpinner size="sm" data-testid="spinner" />)
    expect(screen.getByTestId('spinner')).toHaveClass('h-4', 'w-4')
    
    rerender(<LoadingSpinner size="md" data-testid="spinner" />)
    expect(screen.getByTestId('spinner')).toHaveClass('h-6', 'w-6')
    
    rerender(<LoadingSpinner size="lg" data-testid="spinner" />)
    expect(screen.getByTestId('spinner')).toHaveClass('h-8', 'w-8')
  })

  it('animate-spin sınıfı eklenir', () => {
    render(<LoadingSpinner data-testid="spinner" />)
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin')
  })
})

describe('EmptyState Bileşeni', () => {
  it('başlık ve açıklama metni gösterilir', () => {
    render(
      <EmptyState
        title="Veri Yok"
        description="Henüz hiçbir veri bulunmuyor"
      />
    )
    
    expect(screen.getByText('Veri Yok')).toBeInTheDocument()
    expect(screen.getByText('Henüz hiçbir veri bulunmuyor')).toBeInTheDocument()
  })

  it('action butonu tıklanabilir', () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title="Test"
        description="Test açıklama"
        action={{
          label: "Yenile",
          onClick: handleAction
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: 'Yenile' })
    fireEvent.click(actionButton)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('özel icon gösterilebilir', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Icon</div>
    
    render(
      <EmptyState
        title="Test"
        description="Test"
        icon={<CustomIcon />}
      />
    )
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
