"use client";

import { useState } from "react";
import { Download, LogOut, ShieldCheck } from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { requireSupabase } from "@/src/lib/supabaseClient";

const exportQueries = [
  ["profile", (db) => db.from("profiles").select("*").maybeSingle()],
  ["fitness_profiles", (db) => db.from("fitness_profiles").select("*").order("created_at", { ascending: false })],
  ["goals", (db) => db.from("goals").select("*").order("created_at", { ascending: false })],
  ["workout_plans", (db) => db.from("user_workout_plans").select("*").order("created_at", { ascending: false })],
  ["workout_sessions", (db) => db.from("user_workout_sessions").select("*").order("scheduled_for", { ascending: false })],
  ["completed_workouts", (db) => db.from("completed_workouts").select("*").order("completed_at", { ascending: false })],
  ["favorite_workouts", (db) => db.from("favorite_workouts").select("*").order("created_at", { ascending: false })],
  ["nutrition_logs", (db) => db.from("nutrition_logs").select("*, meals(*)").order("log_date", { ascending: false })],
  ["water_logs", (db) => db.from("water_logs").select("*").order("log_date", { ascending: false })],
  ["weight_logs", (db) => db.from("weight_logs").select("*").order("logged_at", { ascending: false })],
  ["body_measurements", (db) => db.from("body_measurements").select("*").order("measured_at", { ascending: false })],
  ["progress_snapshots", (db) => db.from("progress_snapshots").select("*").order("snapshot_date", { ascending: false })],
  ["ai_coach_messages", (db) => db.from("ai_coach_messages").select("*").order("created_at", { ascending: false })],
  ["onboarding_answers", (db) => db.from("onboarding_answers").select("*").maybeSingle()],
  ["pose_sessions", (db) => db.from("pose_sessions").select("*, pose_feedback(*)").order("completed_at", { ascending: false })],
];

function downloadJson(payload, email) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeEmail = String(email || "user").replace(/[^a-z0-9._-]+/gi, "-");
  link.href = url;
  link.download = `pulse-data-${safeEmail}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function buildExportPayload(user) {
  const db = requireSupabase();
  const results = await Promise.all(
    exportQueries.map(async ([key, query]) => {
      try {
        const { data, error } = await query(db);
        return [key, data ?? null, error?.message ?? null];
      } catch (error) {
        return [key, null, error instanceof Error ? error.message : String(error)];
      }
    }),
  );

  const data = {};
  const warnings = [];
  for (const [key, value, warning] of results) {
    data[key] = value;
    if (warning) warnings.push({ section: key, message: warning });
  }

  return {
    app: "Pulse AI Fitness Coach",
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    data,
    warnings,
  };
}

function SettingsContent({ user }) {
  const { signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const exportData = async () => {
    setExporting(true);
    setNotice("");
    setError("");
    try {
      const payload = await buildExportPayload(user);
      downloadJson(payload, user.email);
      setNotice(
        payload.warnings.length
          ? "Export created with partial data. Check the warnings inside the JSON file."
          : "Export created successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout title="Settings" subtitle="Account access and private data export.">
      <div className="grid gap-5">
        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.07)]">
          <h2 className="text-lg font-black text-[#111827]">Account</h2>
          <p className="mt-2 text-sm leading-7 text-[#6b7280]">
            Signed in as <span className="font-semibold text-[#111827]">{user.email}</span>.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.replace("/login");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </section>

        <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.07)]">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[#22c55e]" />
            <h2 className="text-lg font-black text-[#111827]">Data export</h2>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#6b7280]">
            Download your profile, goals, workouts, nutrition logs, progress, pose sessions, and coach chat history.
          </p>
          <button
            type="button"
            onClick={exportData}
            disabled={exporting}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-3 text-sm font-bold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export my data"}
          </button>
        </section>

        <section className="rounded-[1.5rem] border border-[#dcfce7] bg-[#f0fdf4] p-5">
          <div className="flex items-center gap-2 text-[#166534]">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-black">Privacy</h2>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#166534]">
            Personal rows are read through your active Supabase session, so row-level security keeps the export scoped to your account.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      {({ user }) => <SettingsContent user={user} />}
    </ProtectedRoute>
  );
}
