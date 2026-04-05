"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00ff87]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#60efff]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="glass-card p-8 sm:p-10 shadow-2xl">
          {/* Content */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 pt-6 border-t border-[#27272a] text-center">
              {footer}
            </div>
          )}
        </div>

        {/* Decorative corner accents */}
        <div className="absolute -top-3 -left-3 w-20 h-20 border-l-2 border-t-2 border-[#00ff87]/30 rounded-tl-2xl pointer-events-none" />
        <div className="absolute -bottom-3 -right-3 w-20 h-20 border-r-2 border-b-2 border-[#00ff87]/30 rounded-br-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
}