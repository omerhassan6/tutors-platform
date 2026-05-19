import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

// Pages that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/404']

export function useAuth(requireAuth = true): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Fetch the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (requireAuth && !session && !PUBLIC_ROUTES.includes(router.pathname)) {
        router.replace('/login')
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (requireAuth && !session && !PUBLIC_ROUTES.includes(router.pathname)) {
          router.replace('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, requireAuth])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }, [router])

  return { user, session, loading, signOut }
}
