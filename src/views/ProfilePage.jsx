"use client";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Dumbbell,
  Mail,
  Ruler,
  Scale,
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

function ProfileAvatar({ profile, user }) {
  const name = profile?.name || user?.email || "Athlete";
  const initials = name.trim().charAt(0).toUpperCase();

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.7rem] border border-white/20 bg-emerald-300 text-emerald-950 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      {profile?.profile_image ? (
        <span
          role="img"
          aria-label={`${name} profile`}
          className="block h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.profile_image})` }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-4xl font-black">
          {initials}
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.07] px-4 py-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-100/65">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value, tone = "neutral" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-[#f3f4f6] text-[#4b5563]";

  return (
    <div className="rounded-[1.2rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.045)]">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
      <p className="mt-1 text-base font-black text-[#111827]">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[1.5rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ecfdf3] text-[#16a34a]">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-black tracking-[-0.02em] text-[#111827]">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileContent({ user, profile, refreshProfile }) {
  const displayName = profile?.name || user?.email?.split("@")[0] || "Athlete";
  const equipment = profile?.equipment_available?.length
    ? profile.equipment_available
    : ["Bodyweight"];

  return (
    <AppLayout title="Profile" subtitle="Body profile, goals, and training preferences." profile={profile}>
      <div className="grid gap-5">
        <section className="overflow-hidden rounded-[1.7rem] border border-[#dce7df] bg-[#06120b] p-5 text-white shadow-[0_24px_70px_rgba(5,18,11,0.16)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar profile={profile} user={user} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Pulse member
                </p>
                <h2 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  {displayName}
                </h2>
                <p className="mt-3 flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-50/70">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <SummaryPill label="Goal" value={labelize(profile?.goal)} />
              <SummaryPill label="Level" value={labelize(profile?.fitness_level)} />
              <SummaryPill label="Member since" value={formatDate(profile?.created_at)} />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailCard icon={UserRound} label="Age" value={profile?.age ? `${profile.age}` : "Not set"} />
          <DetailCard icon={Ruler} label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "Not set"} />
          <DetailCard icon={Scale} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "Not set"} />
          <DetailCard icon={CalendarDays} label="Days/week" value={profile?.workout_days_per_week || "Not set"} tone="green" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Body details" icon={Activity}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailCard icon={Activity} label="Gender" value={labelize(profile?.gender)} />
              <DetailCard icon={Target} label="Goal" value={labelize(profile?.goal)} tone="green" />
              <DetailCard icon={ShieldCheck} label="Diet" value={labelize(profile?.dietary_preference, "Standard")} />
              <DetailCard icon={Dumbbell} label="Level" value={labelize(profile?.fitness_level)} />
            </div>
          </SectionCard>

          <SectionCard title="Training preferences" icon={Dumbbell}>
            <div className="flex flex-wrap gap-2">
              {equipment.map((item) => (
                <span key={item} className="rounded-full border border-[#dbe5dd] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#374151]">
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
          </SectionCard>
        </section>

        <section className="rounded-[1.7rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_18px_45px_rgba(17,24,39,0.07)] sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-[#e5e7eb] pb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#16a34a]">Edit profile</p>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#111827]">
              Update your details
            </h2>
            <p className="text-sm leading-6 text-[#6b7280]">
              Keep your body profile and training preferences accurate so plans stay useful.
            </p>
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
