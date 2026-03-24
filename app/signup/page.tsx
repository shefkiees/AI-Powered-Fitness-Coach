"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, Dumbbell, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) return setError("Shkruani emrin tuaj")
    if (!email.includes("@")) return setError("Email jo valid")
    if (password.length < 6) return setError("Fjalëkalimi duhet të jetë +6 karaktere")

    setLoading(true)

    try {
      const { error: authError } = await signUp(email, password, name)
      if (authError) {
        setError(authError.message)
      } else {
        router.push("/login")
      }
    } catch {
      setError("Diçka shkoi gabim. Provoni përsëri.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#a3e635]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#a3e635]/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form 
          onSubmit={handleSignup} 
          className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl space-y-6"
        >
          {/* Header me Figure Fitnessi (Njeriu duke ngritur tenga) */}
          <div className="text-center space-y-3">
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-[#a3e635]/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-6 bg-[#a3e635] rounded-full shadow-[0_0_20px_rgba(163,230,53,0.4)] flex flex-col items-center justify-center overflow-hidden">
                
                {/* Figura e Njeriut (Custom Silhouette) */}
                <div className="relative flex flex-col items-center animate-bounce duration-1000">
                  {/* Koka */}
                  <div className="w-3 h-3 bg-black rounded-full mb-0.5" />
                  {/* Tëngat dhe Krahët */}
                  <Dumbbell className="w-10 h-10 text-black stroke-[3px]" />
                </div>

              </div>
            </div>
            
            <div className="pt-2">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                AI <span className="text-[#a3e635]">FITNESS</span>
              </h1>
              <p className="text-zinc-400 text-sm font-medium tracking-wide mt-1">
                KRIJO LLOGARINË TUAJ SOT
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Inputi i Emrit */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest ml-1">Emri i plotë</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#a3e635] transition-colors" />
                <input
                  type="text"
                  placeholder="Shkruaj emrin..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-[#a3e635] transition-all outline-none text-sm text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Inputi i Emailit */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest ml-1">Email Adresa</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#a3e635] transition-colors" />
                <input
                  type="email"
                  placeholder="email@shembull.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-[#a3e635] transition-all outline-none text-sm text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Inputi i Passwordit */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest ml-1">Fjalëkalimi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#a3e635] transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-[#a3e635] transition-all outline-none text-sm text-white"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center text-xs font-bold animate-pulse">
              {error}
            </div>
          )}

          {/* Butoni Vashdo */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#a3e635] hover:bg-[#bef264] text-black font-black py-5 rounded-[1.2rem] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(163,230,53,0.2)]"
          >
            <span className="text-base tracking-tighter uppercase">
              {loading ? "Duke u procesuar..." : "VAZHDO DREJT QËLLIMIT"}
            </span>
            {!loading && <ArrowRight className="w-6 h-6 stroke-[3px]" />}
          </button>

          <p className="text-sm text-center text-zinc-500 font-medium">
            Keni një llogari?{" "}
            <Link href="/login" className="text-[#a3e635] hover:underline underline-offset-4 font-bold">
              Identifikohu
            </Link>
          </p>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
          <Dumbbell className="w-4 h-4 text-white" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white">No Pain No Gain</span>
        </div>
      </div>
    </div>
  )
}