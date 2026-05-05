"use client";

import {
  Activity,
  AlertTriangle,
  Dumbbell,
  Mail,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import ProfileForm from "@/src/components/ProfileForm";
import ProtectedRoute from "@/src/components/ProtectedRoute";

function labelize(value, fallback = "Not set") {
  const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value || "").trim();
  if (!text) return fallback;
  return text.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Active";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf0f3] py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#f3f4f6] text-[#374151]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold text-[#4b5563]">{label}</span>
      </div>
      <span className="text-right text-sm font-black text-[#111827]">{value}</span>
    </div>
  );
}

function ProfileAvatar({ profile, user }) {
  const name = profile?.name || user?.email || "Athlete";
  const initials = name.trim().charAt(0).toUpperCase();

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#dcfce7] shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
      {profile?.profile_image ? (
        <span
          role="img"
          aria-label={`${name} profile`}
          className="block h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.profile_image})` }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-4xl font-black text-[#15803d]">
          {initials}
        </div>
      )}
    </div>
  );
}

function ProfileContent({ user, profile, refreshProfile }) {
  const displayName = profile?.name || user?.email?.split("@")[0] || "Athlete";
  const equipment = profile?.equipment_available?.length
    ? profile.equipment_available
    : ["Bodyweight"];

  return (
    <AppLayout title="Profile" subtitle="Your body profile, goals, and training preferences." profile={profile}>
      <div className="grid gap-5">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#e5e7eb] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.07)]">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar profile={profile} user={user} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#16a34a]">
                  Pulse member
                </p>
                <h2 className="mt-2 truncate text-3xl font-black tracking-[-0.03em] text-[#111827]">
                  {displayName}
                </h2>
                <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-[#6b7280]">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[1.2rem] bg-[#f3f4f6] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6b7280]">Goal</p>
                <p className="mt-2 text-sm font-black text-[#111827]">{labelize(profile?.goal)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-[#ecfdf5] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#15803d]">Level</p>
                <p className="mt-2 text-sm font-black text-[#111827]">{labelize(profile?.fitness_level)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-[#fef3c7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#92400e]">Member since</p>
                <p className="mt-2 text-sm font-black text-[#111827]">{formatDate(profile?.created_at)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.5rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[#16a34a]" />
              <h2 className="text-lg font-black text-[#111827]">Body details</h2>
            </div>
            <div className="mt-4">
              <DetailRow icon={UserRound} label="Age" value={profile?.age ? `${profile.age}` : "Not set"} />
              <DetailRow icon={Activity} label="Gender" value={labelize(profile?.gender)} />
              <DetailRow icon={Target} label="Goal" value={labelize(profile?.goal)} />
              <DetailRow icon={ShieldCheck} label="Diet" value={labelize(profile?.dietary_preference, "Standard")} />
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-[#16a34a]" />
              <h2 className="text-lg font-black text-[#111827]">Training preferences</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {equipment.map((item) => (
                <span key={item} className="rounded-full bg-[#f3f4f6] px-3 py-2 text-xs font-black text-[#374151]">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-black text-amber-900">Limitations to consider</p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {profile?.injuries || "No limitations saved yet."}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] sm:p-6">
          <div className="mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#16a34a]">Edit profile</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#111827]">
                Quick edit
              </h2>
            </div>
          </div>
          <ProfileForm
            user={user}
            profile={profile}
            submitLabel="Save profile"
            surface="light"
            compact
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
