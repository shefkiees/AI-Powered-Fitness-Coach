"use client";

import { PulseDashboard } from "@/components/pulse-dashboard/PulseDashboard";
import AppLayout from "@/src/components/AppLayout";
import ProtectedRoute from "@/src/components/ProtectedRoute";

type Profile = Record<string, unknown> | null;

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {({ profile }: { profile: Profile }) => (
        <AppLayout
          title="Home"
          subtitle="Track your training, progress, and next session."
          profile={profile}
        >
          <PulseDashboard />
        </AppLayout>
      )}
    </ProtectedRoute>
  );
}
