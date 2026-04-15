import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const provider = new GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly')
      const result = await signInWithPopup(auth, provider)
      const email = result.user.email

      const isSrccEmail = email && email.endsWith('@srcc.du.ac.in')
      const isTestEmail = email === 'srcc.pc.jc.fns2526@gmail.com'

      if (isSrccEmail || isTestEmail) {
        await login(result.user)
        navigate('/dashboard')
      } else {
        await auth.signOut()
        setError('Access restricted to SRCC email addresses only')
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Login failed. Please try again.')
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-srcc-navy relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-srcc-gold rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-srcc-gold rounded-full blur-[120px]" />
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl w-[450px] z-10 border-t-4 border-srcc-gold">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-srcc-navy rounded-full flex items-center justify-center mb-6 shadow-lg border-2 border-srcc-gold">
            <span className="text-srcc-gold font-bold text-3xl">SRCC</span>
          </div>
          <h1 className="text-3xl font-extrabold text-srcc-navy tracking-tight text-center">
            Placement Cell
          </h1>
          <p className="text-srcc-navy/60 font-medium mt-2 text-center">
            Company Coordinator Dashboard
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-sm">{error}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 hover:border-srcc-gold hover:bg-gray-50 transition-all duration-300 group shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-srcc-navy border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-bold text-lg">Sign in with Google</span>
            </>
          )}
        </button>

        <div className="mt-12 text-center border-t border-gray-100 pt-8">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Internal Portal • Shri Ram College of Commerce
          </p>
        </div>
      </div>
    </div>
  )
}
