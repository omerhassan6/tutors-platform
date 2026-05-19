import React from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { queryClient } from '../lib/queryClient'
import { ErrorBoundary } from '../components/layout/ErrorBoundary'
import { ToastContainer } from '../components/ui/Toast'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastContainer>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </ToastContainer>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
