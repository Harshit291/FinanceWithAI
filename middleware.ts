import NextAuth from "next-auth";
import { authConfigEdge } from "@/lib/auth/config.edge";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfigEdge);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/app/:path*", "/watchlist/:path*", "/reports/:path*"],
};
