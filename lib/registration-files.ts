import type { SubmissionFileAnswer } from "@/lib/registration-types";

export const REGISTRATION_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const REGISTRATION_TOTAL_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export const REGISTRATION_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf";

export const REGISTRATION_FILE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const REGISTRATION_FILE_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
] as const;

export function isAllowedRegistrationFileMimeType(value: string | null | undefined) {
  return REGISTRATION_FILE_ALLOWED_MIME_TYPES.includes(
    (value ?? "") as (typeof REGISTRATION_FILE_ALLOWED_MIME_TYPES)[number],
  );
}

export function isPreviewableRegistrationFileMimeType(value: string | null | undefined) {
  return Boolean(value?.startsWith("image/") || value === "application/pdf");
}

export function getRegistrationFileValidationError(file: File) {
  if (file.size <= 0) return "The selected file is empty.";

  if (file.size > REGISTRATION_FILE_MAX_BYTES) {
    return `File must be ${formatBytes(REGISTRATION_FILE_MAX_BYTES)} or less.`;
  }

  if (!isAllowedRegistrationFileMimeType(file.type)) {
    return "Only JPG, PNG, WebP, or PDF files are accepted.";
  }

  return null;
}

export function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = size >= 10 || unitIndex === 0 ? Math.round(size) : Number(size.toFixed(1));
  return `${formatted} ${units[unitIndex]}`;
}

export function isSubmissionFileAnswer(value: unknown): value is SubmissionFileAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Partial<SubmissionFileAnswer>;
  return (
    typeof candidate.fileId === "string" &&
    candidate.fileId.trim().length > 0
  );
}

export function getSubmissionFileId(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (!isSubmissionFileAnswer(value)) return "";
  return value.fileId.trim();
}

export function getSubmissionFileName(value: unknown) {
  if (!isSubmissionFileAnswer(value)) return "";
  return value.fileName.trim();
}
