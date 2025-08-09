import React from 'react'
import { Provider } from 'jotai'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { MainLayout } from '@/components/layout/MainLayout'
import '@/style/globals.css'

const App: React.FC = () => {
  return (
    <Provider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </Provider>
  )
}

export default App
