import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { userService } from '../services/user'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (firebaseUser: FirebaseUser) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('coordinatorUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (firebaseUser: FirebaseUser) => {
    const userData = await userService.getOrCreateUser(firebaseUser)
    setUser(userData)
    localStorage.setItem('coordinatorUser', JSON.stringify(userData))
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('coordinatorUser')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
