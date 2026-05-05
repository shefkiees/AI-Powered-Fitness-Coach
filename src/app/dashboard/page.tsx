"use client";

import { PulseDashboard } from "@/components/pulse-dashboard/PulseDashboard";
import AppLayout from "@/src/components/AppLayout";
import ProtectedRoute from "@/src/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout title="Home" subtitle="Track your training, progress, and next session.">
        <PulseDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}
