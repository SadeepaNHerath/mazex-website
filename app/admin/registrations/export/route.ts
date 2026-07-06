import { NextResponse } from "next/server";
import {
  getRegistrationFormBySlug,
  listAllRegistrationSubmissionDetails,
} from "@/lib/registrations";
import { formatDateTimeDisplay } from "@/lib/date-format";
import { getSubmissionFileName, isSubmissionFileAnswer } from "@/lib/registration-files";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatExportValue(value: unknown) {
  if (isSubmissionFileAnswer(value)) {
    return getSubmissionFileName(value) || value.fileId;
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const formSlug = url.searchParams.get("form")?.trim() ?? "";
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";

  if (!formSlug) {
    return NextResponse.json(
      { error: "Missing required form parameter." },
      { status: 400 },
    );
  }

  const form = await getRegistrationFormBySlug(formSlug);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const details = await listAllRegistrationSubmissionDetails({
    formId: form.id,
    from: from || null,
    to: to || null,
  });
  const submissionFields = form.fields.filter((field) => field.scope === "submission");
  const memberFields = form.fields.filter((field) => field.scope === "member");
  const maxMembers = details.reduce(
    (max, detail) => Math.max(max, detail.memberAnswers.length),
    0,
  );

  const headers = [
    "Submitted At",
    "Decision Status",
    "Decision Email Sent At",
    "Team Name",
    ...submissionFields.map((field) => `Submission: ${field.label}`),
    ...Array.from({ length: maxMembers }).flatMap((_, memberIndex) =>
      memberFields.map((field) => `Member ${memberIndex + 1}: ${field.label}`),
    ),
  ];

  const rows = details.map((detail) => {
    const baseColumns = [
      formatDateTimeDisplay(detail.createdAt),
      detail.decisionStatus,
      detail.decisionEmailSentAt
        ? formatDateTimeDisplay(detail.decisionEmailSentAt)
        : "",
      detail.teamName ?? "",
      ...submissionFields.map((field) => formatExportValue(detail.answers[field.key] ?? "")),
    ];
    const memberColumns = Array.from({ length: maxMembers }).flatMap(
      (_, memberIndex) => {
        const member = detail.memberAnswers[memberIndex] ?? {};

        return memberFields.map((field) => formatExportValue(member[field.key] ?? ""));
      },
    );

    return [...baseColumns, ...memberColumns];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n");
  const fileName = `${form.slug}-submissions.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
