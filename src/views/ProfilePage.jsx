"use client";

import {
  Activity,
  CalendarDays,
  Dumbbell,
  Mail,
  Ruler,
  Scale,
  Target,
  UserRound,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import ProfileForm from "@/src/components/ProfileForm";
import ProtectedRoute from "@/src/components/ProtectedRoute";

function labelize(value, fallback = "Not set") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="rounded-[1.25rem] bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
      <p className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#6b7280]">
        <Icon className="h-4 w-4 text-[#22c55e]" />
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-[#111827]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-semibold text-[#6b7280]">{helper}</p> : null}
    </article>
  );
}

function ProfileContent({ user, profile, refreshProfile }) {
  return (
    <AppLayout title="Profile" subtitle="Your body profile, goals, and training preferences.">
      <div className="grid gap-5">
        <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.07)]">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#dcfce7] text-xl font-black text-[#15803d]">
              {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#22c55e]">Pulse member</p>
              <h2 className="mt-1 truncate text-2xl font-black text-[#111827]">
                {profile?.name || user?.email?.split("@")[0] || "Athlete"}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <StatCard icon={Target} label="Goal" value={labelize(profile?.goal)} />
          <StatCard icon={Activity} label="Level" value={labelize(profile?.fitness_level)} />
          <StatCard icon={CalendarDays} label="Weekly plan" value={`${profile?.workout_days_per_week || 3} days`} />
          <StatCard icon={Dumbbell} label="Equipment" value={labelize(profile?.equipment_available?.join?.(", "), "Bodyweight")} />
          <StatCard icon={Ruler} label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "Not set"} />
          <StatCard icon={Scale} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "Not set"} />
        </section>

        {profile?.injuries ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-black">Limitations to consider</p>
            <p className="mt-2 leading-6">{profile.injuries}</p>
          </section>
        ) : null}

        <section className="pulse-card rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[var(--fc-accent)]" />
            <h2 className="text-lg font-black text-white">Edit profile</h2>
          </div>
          <ProfileForm
            user={user}
            profile={profile}
            submitLabel="Save profile"
            onSaved={() => {
              void refreshProfile();
            }}
          />
        </section>
      </div>
    </AppLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      {({ user, profile, refreshProfile }) => (
        <ProfileContent user={user} profile={profile} refreshProfile={refreshProfile} />
      )}
    </ProtectedRoute>
  );
}
