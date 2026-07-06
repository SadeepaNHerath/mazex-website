import "server-only";

import { createHash } from "node:crypto";
import {
  AppwriteException,
  ID,
  Messaging,
  MessagingProviderType,
  Query,
  Users,
  type Models,
} from "node-appwrite";
import { createAppwriteAdminClient } from "@/lib/appwrite";

export type RegistrationDecision = "approved" | "declined";

const CONTACT_ID_PREFIX = "contact_";
const CONTACT_HASH_LENGTH = 28;
const PRIMARY_EMAIL_TARGET_ID = "primary_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export const DEFAULT_APPROVAL_EMAIL_SUBJECT = "MazeX Registration Approved";
export const DEFAULT_APPROVAL_EMAIL_TEMPLATE =
  "Hi {{name}},\n\nYour {{formTitle}} submission has been approved.";
export const DEFAULT_DECLINE_EMAIL_SUBJECT = "MazeX Registration Update";
export const DEFAULT_DECLINE_EMAIL_TEMPLATE =
  "Hi {{name}},\n\nYour {{formTitle}} submission was not approved this time.";

function createUsersService() {
  return new Users(createAppwriteAdminClient());
}

function createMessagingService() {
  return new Messaging(createAppwriteAdminClient());
}

export function normalizeDecisionEmailAddress(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidDecisionEmailAddress(value: string) {
  return EMAIL_PATTERN.test(value);
}

function buildScopedId(prefix: string, email: string) {
  const hash = createHash("sha256").update(email).digest("hex");
  return `${prefix}${hash.slice(0, CONTACT_HASH_LENGTH)}`;
}

function getContactUserId(email: string) {
  return buildScopedId(CONTACT_ID_PREFIX, email);
}

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTemplate(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(/\{\{\s*(name|formTitle|eventTitle|submittedAt|decision)\s*\}\}/g, (_match, key: string) => {
    const value = values[key] ?? "";
    return value || (key === "name" ? "there" : "");
  });
}

function textToHtml(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p>Your registration status has been updated.</p>";
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:#3f3f46;">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`,
    )
    .join("");
}

function buildDecisionEmailHtml(params: {
  title: string;
  body: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">MazeX Registration</p>
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#18181b;">${escapeHtml(params.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                ${textToHtml(params.body)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function getOrCreateUser(params: {
  email: string;
  name: string | null;
}) {
  const users = createUsersService();
  const userId = getContactUserId(params.email);
  let user: Models.User<Models.Preferences> | null = null;

  try {
    user = await users.get({ userId });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
  }

  if (!user) {
    try {
      user = await users.create({
        userId,
        email: params.email,
        name: params.name || undefined,
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 409) {
        throw error;
      }

      const matches = await users.list({
        queries: [Query.equal("email", params.email), Query.limit(1)],
      });
      user = matches.users[0] ?? null;
      if (!user) throw error;
    }
  }

  if (params.name && trim(user.name) !== params.name) {
    user = await users.updateName({
      userId: user.$id,
      name: params.name,
    });
  }

  return user;
}

async function getOrCreateEmailTarget(params: {
  userId: string;
  email: string;
  name: string | null;
}) {
  const users = createUsersService();
  const providerId = process.env.APPWRITE_MESSAGING_EMAIL_PROVIDER_ID?.trim() || "";
  const targets = await users.listTargets({
    userId: params.userId,
    queries: [Query.limit(100)],
  });
  const targetName = params.name || params.email;
  const existingTarget =
    (targets.targets ?? []).find(
      (target) =>
        target.providerType === "email" &&
        normalizeDecisionEmailAddress(target.identifier) === params.email,
    ) ??
    (targets.targets ?? []).find((target) => target.providerType === "email") ??
    null;

  if (!existingTarget) {
    try {
      return await users.createTarget({
        userId: params.userId,
        targetId: PRIMARY_EMAIL_TARGET_ID,
        providerType: MessagingProviderType.Email,
        identifier: params.email,
        providerId: providerId || undefined,
        name: targetName,
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 409) {
        throw error;
      }

      const refreshed = await users.listTargets({
        userId: params.userId,
        queries: [Query.limit(100)],
      });
      const target = (refreshed.targets ?? []).find(
        (candidate) => candidate.providerType === "email",
      );
      if (!target) throw error;
      return target;
    }
  }

  if (
    normalizeDecisionEmailAddress(existingTarget.identifier) === params.email &&
    trim(existingTarget.name) === targetName &&
    (!providerId || trim(existingTarget.providerId) === providerId)
  ) {
    return existingTarget;
  }

  return users.updateTarget({
    userId: params.userId,
    targetId: existingTarget.$id,
    identifier: params.email,
    providerId: providerId || undefined,
    name: targetName,
  });
}

export async function sendRegistrationDecisionEmail(params: {
  decision: RegistrationDecision;
  recipientEmail: string;
  recipientName: string | null;
  formTitle: string;
  eventTitle: string;
  submittedAt: string;
  subjectTemplate: string | null;
  bodyTemplate: string | null;
}) {
  const recipientEmail = normalizeDecisionEmailAddress(params.recipientEmail);
  if (!isValidDecisionEmailAddress(recipientEmail)) {
    throw new Error("The selected submission email address is not valid.");
  }

  const subjectTemplate =
    trim(params.subjectTemplate) ||
    (params.decision === "approved"
      ? DEFAULT_APPROVAL_EMAIL_SUBJECT
      : DEFAULT_DECLINE_EMAIL_SUBJECT);
  const bodyTemplate =
    trim(params.bodyTemplate) ||
    (params.decision === "approved"
      ? DEFAULT_APPROVAL_EMAIL_TEMPLATE
      : DEFAULT_DECLINE_EMAIL_TEMPLATE);
  const values = {
    name: params.recipientName || "there",
    formTitle: params.formTitle,
    eventTitle: params.eventTitle,
    submittedAt: params.submittedAt,
    decision: params.decision === "approved" ? "Approved" : "Declined",
  };
  const subject = renderTemplate(subjectTemplate, values).slice(0, 255);
  const body = renderTemplate(bodyTemplate, values);
  const user = await getOrCreateUser({
    email: recipientEmail,
    name: params.recipientName,
  });
  const target = await getOrCreateEmailTarget({
    userId: user.$id,
    email: recipientEmail,
    name: params.recipientName,
  });

  await createMessagingService().createEmail({
    messageId: ID.unique(),
    subject,
    content: buildDecisionEmailHtml({
      title: subject,
      body,
    }),
    targets: [target.$id],
    html: true,
  });

  return {
    recipientEmail,
    subject,
  };
}
