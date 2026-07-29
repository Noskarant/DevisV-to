import { NextResponse } from "next/server";
import { reconcileCheckoutReturn } from "@/lib/stripe/fulfillment";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const sessionId = url.searchParams.get("session_id")?.trim();

  if (!token || !sessionId) {
    return NextResponse.redirect(new URL("/analyser?payment=invalid", url.origin));
  }

  try {
    const result = await reconcileCheckoutReturn({ token, sessionId });
    const status = result.fulfilled ? "success" : "pending";
    return NextResponse.redirect(
      new URL(`/apercu/${encodeURIComponent(token)}?payment=${status}`, url.origin)
    );
  } catch (error) {
    console.error(
      "[CHECKOUT_COMPLETE]",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.redirect(
      new URL(`/apercu/${encodeURIComponent(token)}?payment=verification-error`, url.origin)
    );
  }
}
