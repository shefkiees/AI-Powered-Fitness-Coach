"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-sans relative overflow-hidden">
      
      {/* Efekte drite në sfond (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            AI Fitness Coach 🏋️‍♂️
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Asistenti juaj personal për stërvitje dhe ushqyerje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="P.sh. Çfarë ushtrimesh të bëj për të humbur peshë në shtëpi?"
              className="w-full bg-gray-900/50 border border-gray-700 text-gray-100 p-4 rounded-2xl h-36 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 resize-none placeholder-gray-500 custom-scrollbar"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Po analizon...
                </>
              ) : (
                "Dërgo Pyetjen"
              )}
            </span>
          </button>
        </form>

        {error && !loading && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-center animate-fade-in">
            {error}
          </div>
        )}

        {response && !loading && (
          <div className="mt-8 p-6 bg-gray-900/60 border border-emerald-500/20 rounded-2xl shadow-inner animate-fade-in-up">
            <h2 className="flex items-center gap-2 text-emerald-400 font-bold mb-4 text-lg border-b border-gray-700/50 pb-2">
              <span>🤖</span> Përgjigja nga Trajneri:
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}