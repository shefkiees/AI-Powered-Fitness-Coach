import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Fitness Coach",
  description:
    "AI-powered fitness coach with personalized workouts, nutrition guidance, and progress tracking.",
  icons: {
    icon: "/brand/ai-fitness-coach-icon.svg",
    shortcut: "/brand/ai-fitness-coach-icon.svg",
    apple: "/brand/ai-fitness-coach-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--fc-bg-page)] font-sans antialiased text-[var(--fc-text)]`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
