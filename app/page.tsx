"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);  // <-- Shto router këtu

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();
      setResponse(data.reply);
    } catch (error) {
      console.error(error);
      setError("Diçka shkoi gabim. Ju lutemi provoni përsëri.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-sans relative overflow-hidden">
      <button
        onClick={logout}
        className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
      >
        Logout
      </button>

      {/* Glow background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            AI Fitness Coach 🏋️‍♂️
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Mirë se erdhe {user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="P.sh. Çfarë ushtrimesh të bëj për të humbur peshë në shtëpi?"
            className="w-full bg-gray-900/50 border border-gray-700 text-gray-100 p-4 rounded-2xl h-36 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Po analizon..." : "Dërgo Pyetjen"}
          </button>
        </form>

        {error && !loading && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        {response && !loading && (
          <div className="mt-8 p-6 bg-gray-900/60 border border-emerald-500/20 rounded-2xl shadow-inner">
            <h2 className="text-emerald-400 font-bold mb-4 text-lg border-b border-gray-700/50 pb-2">
              🤖 Përgjigja nga Trajneri:
            </h2>
            <div className="text-gray-300 whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}