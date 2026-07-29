import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const payment = request.nextUrl.searchParams.get("payment");
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const previewMatch = request.nextUrl.pathname.match(/^\/apercu\/([^/]+)$/);

  if (payment === "success" && sessionId && previewMatch?.[1]) {
    const completionUrl = request.nextUrl.clone();
    completionUrl.pathname = "/api/public/checkout/complete";
    completionUrl.search = "";
    completionUrl.searchParams.set("token", decodeURIComponent(previewMatch[1]));
    completionUrl.searchParams.set("session_id", sessionId);
    return NextResponse.redirect(completionUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
