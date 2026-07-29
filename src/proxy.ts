import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const payment = request.nextUrl.searchParams.get("payment");
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (payment !== "success" || !sessionId) return NextResponse.next();

  const match = request.nextUrl.pathname.match(/^\/apercu\/([^/]+)$/);
  const token = match?.[1];
  if (!token) return NextResponse.next();

  const completionUrl = request.nextUrl.clone();
  completionUrl.pathname = "/api/public/checkout/complete";
  completionUrl.search = "";
  completionUrl.searchParams.set("token", decodeURIComponent(token));
  completionUrl.searchParams.set("session_id", sessionId);
  return NextResponse.redirect(completionUrl);
}

export const config = {
  matcher: "/apercu/:token",
};
