import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/goals",
  "/nutrition-plan",
  "/exercise-library",
  "/workout-plan",
  "/progress-tracker",
  "/settings",
  "/workout",
  "/pose-estimation",
  "/profile",
  "/profile-setup",
];

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

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToLogin(request, path);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return redirectToLogin(request, path);
    }
  } catch {
    return redirectToLogin(request, path);
  }

  return response;
}

function redirectToLogin(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", path);

  return NextResponse.redirect(url);
}
