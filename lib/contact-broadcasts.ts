import "server-only";

import { AppwriteException, ExecutionMethod, Functions } from "node-appwrite";
import { createAppwriteAdminClient } from "@/lib/appwrite";
import type { RegistrationContactSegmentKey } from "@/lib/registration-contact-segments";

const DEFAULT_RESEND_CONTACTS_FUNCTION_ID = "registration_resend_contacts";

type ResendContactsExecutionResponse = {
  ok?: boolean;
  message?: string;
};

type ContactBroadcastExecutionResponse = ResendContactsExecutionResponse & {
  broadcastId?: string;
  segmentKey?: RegistrationContactSegmentKey;
  segmentName?: string;
};

type ContactBackfillExecutionResponse = ResendContactsExecutionResponse & {
  processedCount?: number;
  syncedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
};

export class ContactBroadcastConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactBroadcastConfigError";
  }
}

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getContactBroadcastConfig() {
  return {
    functionId:
      process.env.APPWRITE_FUNCTION_RESEND_CONTACTS_ID?.trim() ||
      DEFAULT_RESEND_CONTACTS_FUNCTION_ID,
  };
}

function parseExecutionResponseBody<T extends ResendContactsExecutionResponse>(
  responseBody: string,
): T | null {
  const normalized = trim(responseBody);
  if (!normalized) return null;

  try {
    const parsed = JSON.parse(normalized);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

function getExecutionErrorMessage(error: unknown) {
  if (error instanceof AppwriteException) {
    return error.message || "Appwrite could not execute the Resend contact function.";
  }

  if (error instanceof ContactBroadcastConfigError) {
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Unable to send the marketing broadcast right now.";
}

function getNumericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function executeResendContactsFunction<T extends ResendContactsExecutionResponse>(
  body: Record<string, unknown>,
) {
  const { functionId } = getContactBroadcastConfig();
  const functions = new Functions(createAppwriteAdminClient());
  const execution = await functions.createExecution({
    functionId,
    async: false,
    method: ExecutionMethod.POST,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const response = parseExecutionResponseBody<T>(execution.responseBody);
  const fallbackMessage =
    response?.message ||
    trim(execution.errors) ||
    trim(execution.responseBody) ||
    "The Resend contact function did not return a usable response.";

  if (
    execution.status !== "completed" ||
    execution.responseStatusCode >= 400 ||
    !response?.ok
  ) {
    throw new Error(fallbackMessage);
  }

  return response;
}

export async function sendRegistrationContactBroadcast(params: {
  segmentKey: RegistrationContactSegmentKey;
  subject: string;
  content: string;
}) {
  const subject = trim(params.subject);
  const content = trim(params.content);

  if (!subject) {
    throw new Error("Enter an email subject.");
  }

  if (!content) {
    throw new Error("Enter the email content.");
  }

  const response = await executeResendContactsFunction<ContactBroadcastExecutionResponse>({
    action: "send-broadcast",
    segmentKey: params.segmentKey,
    subject,
    content,
  });

  return {
    broadcastId: trim(response.broadcastId),
    segmentKey: (response.segmentKey || params.segmentKey) as RegistrationContactSegmentKey,
    segmentName: trim(response.segmentName) || null,
  };
}

export async function syncExistingRegistrationContacts(params?: {
  batchSize?: number;
  cursorAfter?: string | null;
}) {
  const response = await executeResendContactsFunction<ContactBackfillExecutionResponse>({
    action: "sync-existing-submissions",
    batchSize: params?.batchSize ?? 100,
    cursorAfter: trim(params?.cursorAfter),
  });

  return {
    processedCount: getNumericValue(response.processedCount),
    syncedCount: getNumericValue(response.syncedCount),
    skippedCount: getNumericValue(response.skippedCount),
    failedCount: getNumericValue(response.failedCount),
    nextCursor: trim(response.nextCursor) || null,
    hasMore: Boolean(response.hasMore),
  };
}

export { getExecutionErrorMessage };
