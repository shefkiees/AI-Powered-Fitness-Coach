"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"
import { User, AuthError, AuthResponse as SupabaseAuthResponse } from "@supabase/supabase-js"

// Definimi i tipit për AuthResponse pa any
interface AuthResponse {
  data: SupabaseAuthResponse['data'] | null
  error: AuthError | null
}

// Definimi i tipit të context-it
interface AuthContextType {
  user: User | null
  loading: boolean  // <-- Shto këtë
  signUp: (email: string, password: string, name: string) => Promise<AuthResponse>
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
}

// Props për AuthProvider
interface AuthProviderProps {
  children: ReactNode
}

// Krijo context me tipin e duhur
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)  // <-- Shto këtë

  useEffect(() => {
    // Merr session kur refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)  // <-- Shto këtë
    })

    // Listen changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)  // <-- Shto këtë
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // SIGN UP
  const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    return { data, error }
  }

  // SIGN IN
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  // SIGN OUT
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}