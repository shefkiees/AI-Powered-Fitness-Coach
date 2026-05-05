"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Ruler, Scale, Target, User } from "lucide-react";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ACTIVITY_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
  workoutFocusLabel,
} from "@/lib/profileDisplay";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-black/8 bg-[#f7f3e7] px-3 py-3">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#68714f]">
        {label}
      </span>
      <p className="mt-2 text-sm font-semibold text-[#17181b]">{value}</p>
    </div>
  );
}

type Props = { profile: FitnessProfileRow };

export function ProfileSummaryCard({ profile }: Props) {
  const router = useRouter();
  const focus = workoutFocusLabel(profile.workout_preference);
  const quickStats = [
    { icon: Target, label: "Goal", value: GOAL_LABELS[profile.goal] ?? profile.goal },
    {
      icon: Activity,
      label: "Activity",
      value: ACTIVITY_LABELS[profile.activity_level] ?? profile.activity_level,
    },
    { icon: Scale, label: "Weight", value: `${profile.weight} kg` },
    { icon: Ruler, label: "Height", value: `${profile.height} cm` },
  ];

  return (
    <Card className="border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#17181b]">Profile summary</h2>
          <p className="mt-2 text-xs leading-6 text-[#5e654f]">
            Visible only to you and used to calibrate your plan, coach, and recommendations.
          </p>
        </div>
        <span className="rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#68714f]">
          Calibrated
        </span>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] border border-black/8 bg-white/72 p-4">
        <div className="relative h-22 w-22 shrink-0 overflow-hidden rounded-[1.4rem] border border-black/8 bg-white">
          {profile.profile_image ? (
            <Image
              src={profile.profile_image}
              alt=""
              width={88}
              height={88}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#7b816e]">
              <User className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#68714f]">
            Athlete card
          </p>
          <p className="mt-2 text-lg font-semibold text-[#17181b]">
            {GENDER_LABELS[profile.gender] ?? profile.gender}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#5e654f]">
            Age {profile.age}, focused on {focus.toLowerCase()}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {quickStats.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.15rem] border border-black/8 bg-[#f7f3e7] px-3 py-3"
          >
            <div className="flex items-center gap-2 text-[#5e654f]">
              <item.icon className="h-4 w-4 text-[var(--fc-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#68714f]">
                {item.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#17181b]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        <Field label="Gender" value={GENDER_LABELS[profile.gender] ?? profile.gender} />
        <Field label="Age" value={`${profile.age} years`} />
        <Field label="Focus" value={focus} />
      </div>

      <Button
        type="button"
        className="mt-6 w-full rounded-full border-[#111214] bg-[#111214] text-white hover:bg-[#1c1d20]"
        onClick={() => router.push("/profile")}
      >
        Update profile
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}
