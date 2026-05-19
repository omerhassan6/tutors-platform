import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

/**
 * Root page — immediately redirects to /dashboard if authenticated,
 * otherwise redirects to /login.
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/login')
    })
  }, [router])

  return null
}
