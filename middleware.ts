import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/exercise-library",
  "/goals",
  "/nutrition-plan",
  "/pose-estimation",
  "/profile",
  "/profile-setup",
  "/progress-tracker",
  "/settings",
  "/workout",
  "/workout-plan",
];

const AUTH_PAGES = new Set(["/login", "/signup"]);

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedPath(pathname);
  const isAuthPage = AUTH_PAGES.has(pathname);

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const next = `${pathname}${request.nextUrl.search}`;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", next || "/dashboard");
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/exercise-library/:path*",
    "/goals/:path*",
    "/login",
    "/nutrition-plan/:path*",
    "/pose-estimation/:path*",
    "/profile/:path*",
    "/profile-setup",
    "/progress-tracker/:path*",
    "/settings/:path*",
    "/signup",
    "/workout/:path*",
    "/workout-plan/:path*",
  ],
};
