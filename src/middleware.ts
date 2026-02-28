import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ir_session";

export async function middleware(request: NextRequest) {
  const publicPaths = ["/login", "/register", "/"];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path
  );
  const isApiCron = request.nextUrl.pathname.startsWith("/api/cron");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");

  // Allow cron and auth API routes
  if (isApiCron || isApiAuth) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  // No session — redirect to login for protected routes
  if (!sessionId && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Has session — redirect away from auth pages
  if (sessionId && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
