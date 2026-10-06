import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isPublic =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/api-docs" ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up");
    if (!req.nextauth.token && !isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  },
  { callbacks: { authorized: () => true } }
);

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
