"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
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
    <div className="flex flex-col gap-1 rounded-xl border border-slate-800/90 bg-slate-950/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}

type Props = { profile: FitnessProfileRow };

export function ProfileSummaryCard({ profile }: Props) {
  const router = useRouter();
  const focus = workoutFocusLabel(profile.workout_preference);

  return (
    <Card className="border-slate-800/90 bg-slate-900/40 shadow-xl shadow-black/20 backdrop-blur-sm">
      <h2 className="text-lg font-bold text-white">Profile summary</h2>
      <p className="mt-1 text-xs text-slate-500">
        Visible only to you · from Supabase
      </p>
      <div className="mt-5 flex justify-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          {profile.profile_image ? (
            <Image
              src={profile.profile_image}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">
              <User className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <Field
          label="Gender"
          value={GENDER_LABELS[profile.gender] ?? profile.gender}
        />
        <Field label="Age" value={`${profile.age} yrs`} />
        <Field label="Weight" value={`${profile.weight} kg`} />
        <Field label="Height" value={`${profile.height} cm`} />
        <Field label="Goal" value={GOAL_LABELS[profile.goal] ?? profile.goal} />
        <Field
          label="Activity"
          value={
            ACTIVITY_LABELS[profile.activity_level] ?? profile.activity_level
          }
        />
        <Field label="Focus" value={focus} />
      </div>
      <Button
        variant="secondary"
        type="button"
        className="mt-6 w-full border-slate-700"
        onClick={() => router.push("/profile")}
      >
        Update profile
      </Button>
    </Card>
  );
}
