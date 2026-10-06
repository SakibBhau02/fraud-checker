import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const isPublicPage = createRouteMatcher([
  "/",
  "/login",
  "/api-docs",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  // API routes handle their own auth (session / key / guest) — just pass through
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (isPublicPage(req)) return NextResponse.next();
  if ((await auth()).userId) return NextResponse.next();
  const naToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (naToken) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("redirect_url", pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/__clerk/:path*"],
};
