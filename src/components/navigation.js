import {
  Bot,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/workout-plan", label: "Workouts", icon: Dumbbell },
  { href: "/progress-tracker", label: "Activity", icon: HeartPulse },
  { href: "/dashboard/chat", label: "AI Coach", icon: Bot },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export const quickActions = [
  { href: "/workout-plan", label: "Start workout", icon: Dumbbell },
  { href: "/progress-tracker", label: "Log progress", icon: HeartPulse },
  { href: "/dashboard/chat", label: "Open AI coach", icon: Bot },
  { href: "/profile", label: "Edit profile", icon: UserRound },
];
