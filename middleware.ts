import type { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/goals",
    "/goals/:path*",
    "/nutrition-plan",
    "/nutrition-plan/:path*",
    "/exercise-library",
    "/exercise-library/:path*",
    "/workout-plan",
    "/workout-plan/:path*",
    "/progress-tracker",
    "/progress-tracker/:path*",
    "/settings",
    "/settings/:path*",
    "/workout",
    "/workout/:path*",
    "/pose-estimation",
    "/pose-estimation/:path*",
    "/profile",
    "/profile/:path*",
    "/profile-setup",
    "/profile-setup/:path*",
  ],
};
