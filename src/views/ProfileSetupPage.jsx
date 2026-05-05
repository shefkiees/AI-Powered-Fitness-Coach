"use client";

import ProfileForm from "@/src/components/ProfileForm";
import ProtectedRoute from "@/src/components/ProtectedRoute";

function SetupContent({ user }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b07] text-white">
      <main className="relative isolate flex min-h-screen items-center px-4 py-8 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(34,197,94,0.20),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,#071009_0%,#030604_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

        <section className="mx-auto w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Start your plan
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              Complete your profile
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/[0.55]">
              Add only the basics so your first workout and nutrition plan can be created.
            </p>
          </div>

          <ProfileForm
            user={user}
            setup
            surface="dark"
            compact
            minimal
            submitLabel="Create profile"
            onSaved={() => {
              window.setTimeout(() => window.location.replace("/dashboard"), 700);
            }}
          />
        </section>
      </main>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <ProtectedRoute requireProfile={false} redirectIfProfile>
      {({ user }) => <SetupContent user={user} />}
    </ProtectedRoute>
  );
}
