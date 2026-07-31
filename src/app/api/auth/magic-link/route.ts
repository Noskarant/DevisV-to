import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email/send";

const inputSchema = z.object({
  email: z.string().trim().email().max(254),
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(request: NextRequest, email: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${email}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_ATTEMPTS) return true;
  current.count += 1;
  return false;
}

function safeOrigin(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const url = new URL(origin);
  const allowed =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "www.devisveto.fr" ||
    url.hostname === "devisveto.fr" ||
    url.hostname.endsWith(".vercel.app");

  if (!allowed) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.devisveto.fr";
  }

  return origin.replace(/\/$/, "");
}

function actionLinkFromGenerateLink(data: unknown) {
  const compatible = data as {
    properties?: {
      action_link?: string;
      actionLink?: string;
    };
  } | null;

  return compatible?.properties?.action_link ?? compatible?.properties?.actionLink ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    if (isRateLimited(rateLimitKey(request, email))) {
      return NextResponse.json(
        { error: "Un lien vient déjà d’être demandé. Patientez quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    const origin = safeOrigin(request);
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[MAGIC_LINK_GENERATE]", error.message);
      return NextResponse.json(
        { error: "Le lien n’a pas pu être préparé. Réessayez dans quelques instants." },
        { status: 500 }
      );
    }

    const actionLink = actionLinkFromGenerateLink(data);
    if (!actionLink) {
      console.error("[MAGIC_LINK_GENERATE] missing action link");
      return NextResponse.json(
        { error: "Le lien n’a pas pu être préparé. Réessayez dans quelques instants." },
        { status: 500 }
      );
    }

    await sendMagicLinkEmail(email, actionLink);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MAGIC_LINK_SEND]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Le lien n’a pas pu être envoyé. Réessayez dans quelques instants." },
      { status: 500 }
    );
  }
}
