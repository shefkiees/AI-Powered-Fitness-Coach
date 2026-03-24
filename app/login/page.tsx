"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Lock, ArrowRight, Dumbbell, Flame, Target, Zap, Users } from "lucide-react"

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { error: authError } = await signIn(email, password)
      if (authError) setError(authError.message)
      else router.push("/")
    } catch {
      setError("Diçka shkoi gabim. Provoni përsëri.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-black text-white overflow-hidden font-sans relative">
      
      {/* --- LAYER-I I BACKROUND-IT TË PËRBASHKËT (NETWORK) --- */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(#a3e635 0.5px, transparent 0.5px)`,
            backgroundSize: "30px 30px"
          }}
        />
      </div>

      {/* --- ANA E MAJTË: HERO / BRANDING (STILI MASHKULLOR) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 overflow-hidden border-r border-white/5 bg-[#050505]">
        {/* Background-i Mashkullor: Gradient i errët dhe i fortë */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-950/20 via-black to-black opacity-60" />
          <div className="absolute -bottom-32 -left-32 w-[700px] h-[700px] bg-lime-500/5 rounded-full blur-[150px]" />
          {/* Opsionale: Mund të shtoni një imazh 'overlay' me opacity shumë të ulët këtu */}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10"
        >
          {/* Logo Section me shkëlqim më të fortë */}
          <div className="flex items-center gap-4 mb-16">
            <div className="p-3.5 bg-lime-400 text-black rounded-2xl shadow-[0_0_40px_rgba(163,230,53,0.4)]">
              <Dumbbell size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              AI <span className="text-lime-400">FITNESS COACH</span>
            </h1>
          </div>

          {/* Headline më i strukturuar */}
          <div className="space-y-1 mb-10">
            <h2 className="text-[110px] font-black leading-[0.8] tracking-tighter uppercase italic text-white/90">
              NDËRTO
            </h2>
            <h2 className="text-[110px] font-black leading-[0.8] tracking-tighter uppercase italic text-lime-400 drop-shadow-[0_0_20px_rgba(163,230,53,0.5)]">
              FORCËN
            </h2>
          </div>

          <p className="max-w-md text-2xl text-gray-400 font-medium leading-relaxed border-l-4 border-lime-400 pl-8 mb-16 opacity-90">
            Optimizoni stërvitjen tuaj me inteligjencën artificiale për rezultate maksimale.
          </p>

          {/* Features me ikona më të mëdha dhe përshkrime */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5">
            {[
              { icon: Flame, title: "Burn", desc: "Fat Loss" },
              { icon: Zap, title: "Power", desc: "Energy boost" },
              { icon: Target, title: "Goal", desc: "Precise plans" }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-3 text-center">
                <div className="p-4 bg-white/5 rounded-full text-lime-400/90 border border-white/10">
                  <f.icon size={24} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold uppercase tracking-widest text-white/90">{f.title}</div>
                  <div className="text-xs text-gray-500 font-medium">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* --- ANA E DJATHTË: LOGIN FORM (STILI FEMËROR) --- */}
      <div className="flex-1 flex items-center justify-center p-12 relative bg-black">
        {/* Background-i Femëror: Gradient më i butë dhe energjik */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-tl from-lime-950/10 via-black to-black opacity-50" />
          {/* Spotlight Effect që ndjek miun (përmirësuar) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-300"
            style={{
              background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(163, 230, 53, 0.1), transparent 85%)`,
            }}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-lg z-10"
        >
          {/* Card e Login-it më e madhe dhe e pastër */}
          <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/5 rounded-[50px] p-16 shadow-[-10px_-10px_60px_rgba(255,255,255,0.02),10px_10px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Dekorim i hollë neoni në cep */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 rounded-full blur-3xl" />

            <div className="mb-14 text-center lg:text-left space-y-3">
              <div className="flex items-center gap-3 justify-center lg:justify-start text-lime-400/80">
                <Users size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Community access</span>
              </div>
              <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-white/95">Mirësevjen</h3>
              <p className="text-gray-400 text-lg font-medium opacity-90">Hyni në llogarinë tuaj për të filluar.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-5 rounded-2xl text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black text-lime-400 uppercase tracking-[0.25em] ml-3 opacity-90">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lime-400 transition-colors" size={22} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 outline-none focus:border-lime-400/40 focus:bg-white/[0.06] transition-all font-medium text-lg placeholder:text-gray-600"
                    placeholder="emri@shembull.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-lime-400 uppercase tracking-[0.25em] ml-3 opacity-90">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-lime-400 transition-colors" size={22} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 outline-none focus:border-lime-400/40 focus:bg-white/[0.06] transition-all font-medium text-lg placeholder:text-gray-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-lime-400 hover:bg-lime-300 text-black font-black py-6 rounded-2xl flex items-center justify-center gap-4 transition-all transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-tighter text-xl shadow-[0_15px_40px_rgba(163,230,53,0.25)]"
                >
                  {loading ? "Duke hyrë..." : "Vazhdo drejt Qëllimit"}
                  <ArrowRight size={24} />
                </button>
              </div>
            </form>

            <div className="mt-14 text-center">
              <Link href="/signup" className="text-base text-gray-400 hover:text-white transition-all font-medium opacity-90">
                Nuk keni llogari? <span className="text-lime-400 font-black underline underline-offset-8 decoration-2 hover:text-lime-300 ml-1">Regjistrohu Tani</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}