import { loadPublicPreview } from "@/lib/public-preview/data";
import { buildReportViewModel } from "@/lib/public-preview/report";
import { generateReportPdf } from "@/lib/pdf/report-pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const data = await loadPublicPreview(token);

  if (!data) {
    return Response.json({ error: "Rapport introuvable." }, { status: 404 });
  }

  const report = buildReportViewModel(data);
  if (!report.paid) {
    return Response.json(
      { error: "Le rapport complet n’est pas encore disponible pour ce document." },
      { status: 403 }
    );
  }

  const pdf = generateReportPdf(report);
  const animal = safeFilename(report.pet?.name || "animal") || "animal";
  const filename = `devisveto-rapport-${animal}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
