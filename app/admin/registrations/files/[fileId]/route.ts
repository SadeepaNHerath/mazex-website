import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { isPreviewableRegistrationFileMimeType } from "@/lib/registration-files";
import { getRegistrationFileContent } from "@/lib/registrations";

export const dynamic = "force-dynamic";

function contentDispositionFileName(value: string) {
  return value.replace(/["\r\n]/g, "_");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  const file = await getRegistrationFileContent(fileId);

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!isPreviewableRegistrationFileMimeType(file.contentType)) {
    return NextResponse.json({ error: "File preview is not supported" }, { status: 415 });
  }

  return new Response(file.buffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${contentDispositionFileName(file.fileName)}"`,
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
