import "server-only";

import { createHash } from "node:crypto";
import {
  AppwriteException,
  Databases,
  ID,
  Messaging,
  MessagingProviderType,
  Models,
  Query,
  Users,
} from "node-appwrite";
import { createAppwriteAdminClient } from "@/lib/appwrite";

const DEFAULT_CONTACTS_COLLECTION_ID = "registration_contacts";
const DEFAULT_CONTACTS_TOPIC_ID = "registration_contacts";
const DEFAULT_CONTACTS_TOPIC_NAME = "MazeX Registration Contacts";
const PRIMARY_EMAIL_TARGET_ID = "primary_email";
const CONTACT_ID_PREFIX = "contact_";
const CONTACT_SUBSCRIBER_PREFIX = "sub_";
const CONTACT_HASH_LENGTH = 28;

type RegistrationContactDoc = Models.Document & {
  email?: string;
  name?: string | null;
  userId?: string;
  targetId?: string;
  lastFormId?: string | null;
  lastFormTitle?: string | null;
  lastSubmissionId?: string | null;
  lastSubmittedAt?: string | null;
};

export type RegistrationEmailContact = {
  id: string;
  email: string;
  name: string | null;
  userId: string;
  targetId: string;
  lastFormId: string | null;
  lastFormTitle: string | null;
  lastSubmissionId: string | null;
  lastSubmittedAt: string | null;
};

export class MessagingContactsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessagingContactsConfigError";
  }
}

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function trimNullable(value: unknown) {
  const normalized = trim(value);
  return normalized || null;
}

function normalizeEmailAddress(value: unknown) {
  return trim(value).toLocaleLowerCase("en-US");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildScopedId(prefix: string, email: string) {
  const hash = createHash("sha256").update(email).digest("hex");
  return `${prefix}${hash.slice(0, CONTACT_HASH_LENGTH)}`;
}

function getContactDocumentId(email: string) {
  return buildScopedId(CONTACT_ID_PREFIX, email);
}

function getContactUserId(email: string) {
  return buildScopedId(CONTACT_ID_PREFIX, email);
}

function getContactSubscriberId(email: string) {
  return buildScopedId(CONTACT_SUBSCRIBER_PREFIX, email);
}

function getMessagingContactsConfig() {
  const databaseId = process.env.APPWRITE_DB_ID?.trim();

  if (!databaseId) {
    throw new MessagingContactsConfigError(
      "Missing required Appwrite environment variable: APPWRITE_DB_ID",
    );
  }

  return {
    databaseId,
    contactsCollectionId:
      process.env.APPWRITE_COLLECTION_REGISTRATION_CONTACTS?.trim() ||
      DEFAULT_CONTACTS_COLLECTION_ID,
    contactsTopicId:
      process.env.APPWRITE_MESSAGING_CONTACTS_TOPIC_ID?.trim() ||
      DEFAULT_CONTACTS_TOPIC_ID,
    emailProviderId:
      process.env.APPWRITE_MESSAGING_EMAIL_PROVIDER_ID?.trim() || null,
  };
}

function createDatabasesService() {
  return new Databases(createAppwriteAdminClient());
}

function createUsersService() {
  return new Users(createAppwriteAdminClient());
}

function createMessagingService() {
  return new Messaging(createAppwriteAdminClient());
}

function mapRegistrationContactDoc(
  doc: RegistrationContactDoc,
): RegistrationEmailContact | null {
  const email = normalizeEmailAddress(doc.email);
  const userId = trim(doc.userId);
  const targetId = trim(doc.targetId);

  if (!email || !userId || !targetId) {
    return null;
  }

  return {
    id: doc.$id,
    email,
    name: trimNullable(doc.name),
    userId,
    targetId,
    lastFormId: trimNullable(doc.lastFormId),
    lastFormTitle: trimNullable(doc.lastFormTitle),
    lastSubmissionId: trimNullable(doc.lastSubmissionId),
    lastSubmittedAt: trimNullable(doc.lastSubmittedAt),
  };
}

async function getRegistrationContactDocumentByEmail(email: string) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedEmail) return null;

  const { databaseId, contactsCollectionId } = getMessagingContactsConfig();

  try {
    return await createDatabasesService().getDocument<RegistrationContactDoc>(
      databaseId,
      contactsCollectionId,
      getContactDocumentId(normalizedEmail),
    );
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    throw error;
  }
}

async function listAllRegistrationContactDocuments() {
  const { databaseId, contactsCollectionId } = getMessagingContactsConfig();
  const databases = createDatabasesService();
  const documents: RegistrationContactDoc[] = [];
  let offset = 0;

  while (true) {
    const page = await databases.listDocuments<RegistrationContactDoc>(
      databaseId,
      contactsCollectionId,
      [Query.limit(100), Query.offset(offset)],
    );

    documents.push(...page.documents);

    if (page.documents.length < 100) {
      break;
    }

    offset += page.documents.length;
  }

  return documents;
}

async function lookupUserByEmail(email: string) {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedEmail) return null;

  const result = await createUsersService().list({
    queries: [Query.equal("email", normalizedEmail), Query.limit(1)],
  });

  return result.users[0] ?? null;
}

async function ensureRegistrationContactUser(params: {
  email: string;
  name: string | null;
  existingUserId: string | null;
}) {
  const normalizedEmail = normalizeEmailAddress(params.email);
  const users = createUsersService();
  const candidateUserIds = Array.from(
    new Set(
      [trim(params.existingUserId), getContactUserId(normalizedEmail)].filter(
        Boolean,
      ),
    ),
  );

  let user: Models.User | null = null;

  for (const userId of candidateUserIds) {
    try {
      user = await users.get({ userId });
      break;
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) {
        throw error;
      }
    }
  }

  if (!user) {
    try {
      user = await users.create({
        userId: getContactUserId(normalizedEmail),
        email: normalizedEmail,
        name: params.name ?? undefined,
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 409) {
        throw error;
      }

      user = await lookupUserByEmail(normalizedEmail);
      if (!user) {
        throw error;
      }
    }
  }

  if (!user) {
    throw new Error(`Unable to create or locate the messaging user for ${normalizedEmail}.`);
  }

  if (normalizeEmailAddress(user.email) !== normalizedEmail) {
    user = await users.updateEmail({
      userId: user.$id,
      email: normalizedEmail,
    });
  }

  if (params.name && trimNullable(user.name) !== params.name) {
    user = await users.updateName({
      userId: user.$id,
      name: params.name,
    });
  }

  return user;
}

async function listUserTargets(userId: string) {
  return createUsersService().listTargets({
    userId,
    queries: [Query.limit(100)],
  });
}

async function ensureRegistrationContactTarget(params: {
  userId: string;
  email: string;
  name: string | null;
  existingTargetId: string | null;
}) {
  const normalizedEmail = normalizeEmailAddress(params.email);
  const { emailProviderId } = getMessagingContactsConfig();
  const users = createUsersService();
  const targets = await listUserTargets(params.userId);
  const emailTargets = targets.targets.filter(
    (target) => target.providerType === MessagingProviderType.Email,
  );
  const fallbackTargetName = params.name || normalizedEmail;

  const existingTarget =
    emailTargets.find((target) => target.$id === trim(params.existingTargetId)) ||
    emailTargets.find(
      (target) => normalizeEmailAddress(target.identifier) === normalizedEmail,
    ) ||
    emailTargets[0] ||
    null;

  if (!existingTarget) {
    try {
      return await users.createTarget({
        userId: params.userId,
        targetId: trim(params.existingTargetId) || PRIMARY_EMAIL_TARGET_ID,
        providerType: MessagingProviderType.Email,
        identifier: normalizedEmail,
        providerId: emailProviderId ?? undefined,
        name: fallbackTargetName,
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 409) {
        throw error;
      }

      const refreshedTargets = await listUserTargets(params.userId);
      const resolvedTarget =
        refreshedTargets.targets.find(
          (target) => target.providerType === MessagingProviderType.Email,
        ) ?? null;

      if (!resolvedTarget) {
        throw error;
      }

      return resolvedTarget;
    }
  }

  const needsIdentifierUpdate =
    normalizeEmailAddress(existingTarget.identifier) !== normalizedEmail;
  const needsNameUpdate = trim(existingTarget.name) !== fallbackTargetName;
  const needsProviderUpdate =
    Boolean(emailProviderId) && trim(existingTarget.providerId) !== emailProviderId;

  if (!needsIdentifierUpdate && !needsNameUpdate && !needsProviderUpdate) {
    return existingTarget;
  }

  return users.updateTarget({
    userId: params.userId,
    targetId: existingTarget.$id,
    identifier: normalizedEmail,
    providerId: emailProviderId ?? undefined,
    name: fallbackTargetName,
  });
}

async function ensureContactsTopicExists() {
  const { contactsTopicId } = getMessagingContactsConfig();
  const messaging = createMessagingService();

  try {
    await messaging.createTopic({
      topicId: contactsTopicId,
      name: DEFAULT_CONTACTS_TOPIC_NAME,
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 409) {
      throw error;
    }
  }

  return contactsTopicId;
}

async function ensureContactTopicSubscription(params: {
  email: string;
  targetId: string;
}) {
  const topicId = await ensureContactsTopicExists();

  try {
    await createMessagingService().createSubscriber({
      topicId,
      subscriberId: getContactSubscriberId(params.email),
      targetId: params.targetId,
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 409) {
      throw error;
    }
  }
}

async function upsertRegistrationContactDocument(params: {
  email: string;
  name: string | null;
  userId: string;
  targetId: string;
  lastFormId: string | null;
  lastFormTitle: string | null;
  lastSubmissionId: string | null;
  lastSubmittedAt: string | null;
}) {
  const normalizedEmail = normalizeEmailAddress(params.email);
  const { databaseId, contactsCollectionId } = getMessagingContactsConfig();
  const documentId = getContactDocumentId(normalizedEmail);
  const databases = createDatabasesService();
  const data = {
    email: normalizedEmail,
    name: params.name,
    userId: params.userId,
    targetId: params.targetId,
    lastFormId: params.lastFormId,
    lastFormTitle: params.lastFormTitle,
    lastSubmissionId: params.lastSubmissionId,
    lastSubmittedAt: params.lastSubmittedAt,
  };

  try {
    return await databases.updateDocument<RegistrationContactDoc>(
      databaseId,
      contactsCollectionId,
      documentId,
      data,
    );
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
  }

  return databases.createDocument<RegistrationContactDoc>(
    databaseId,
    contactsCollectionId,
    documentId,
    data,
  );
}

function sortContacts(contacts: RegistrationEmailContact[]) {
  return [...contacts].sort((a, b) => {
    const aTime = a.lastSubmittedAt ?? "";
    const bTime = b.lastSubmittedAt ?? "";

    if (aTime && bTime && aTime !== bTime) {
      return bTime.localeCompare(aTime);
    }

    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;

    return a.email.localeCompare(b.email);
  });
}

// Email asset URLs from Appwrite storage bucket
function getEmailAssetUrls() {
  const endpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "") ?? "";
  const projectId = process.env.APPWRITE_PROJECT_ID?.trim() ?? "";
  const bucketId = process.env.APPWRITE_BUCKET_EMAIL_ASSETS?.trim() ?? "email_assets";
  
  const baseUrl = `${endpoint}/storage/buckets/${bucketId}/files`;
  const projectParam = `project=${projectId}`;
  
  return {
    mazexLogo: `${baseUrl}/mazex-logo/view?${projectParam}`,
    mazexLogoWhite: `${baseUrl}/mazex-logo-white/view?${projectParam}`,
    knurdzPoweredBy: `${baseUrl}/knurdz-poweredby/view?${projectParam}`,
    knurdzPoweredByLight: `${baseUrl}/knurdz-poweredby-light/view?${projectParam}`,
  };
}

function buildCustomEmailHtml(content: string) {
  const assets = getEmailAssetUrls();
  const blocks = content
    .trim()
    .split(/\n\s*\n/gu)
    .map((block) =>
      block
        .split(/\n/gu)
        .map((line) => escapeHtml(line))
        .join("<br />"),
    )
    .filter(Boolean);

  const paragraphs =
    blocks.length > 0
      ? blocks
          .map(
            (block) =>
              `<p style="margin: 0 0 16px; line-height: 1.7; font-size: 15px; color: #27272a;">${block}</p>`,
          )
          .join("")
      : `<p style="margin: 0; line-height: 1.7; font-size: 15px; color: #27272a;"></p>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>MazeX</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base */
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f5; }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 auto !important; }
      .email-wrapper { padding: 16px !important; }
      .content-cell { padding: 24px 20px !important; }
      .header-cell { padding: 20px !important; }
      .responsive-table { width: 100% !important; }
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body, .body-bg { background-color: #09090b !important; }
      .email-container { background-color: #18181b !important; border-color: #27272a !important; }
      .header-cell { background-color: #18181b !important; border-color: #27272a !important; }
      .content-cell { background-color: #18181b !important; }
      .text-dark { color: #f4f4f5 !important; }
      .text-muted { color: #a1a1aa !important; }
      .border-color { border-color: #27272a !important; }
      .dark-logo { display: inline-block !important; max-height: 40px !important; }
      .light-logo { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .footer-dark-logo { display: inline-block !important; max-height: 24px !important; }
      .footer-light-logo { display: none !important; max-height: 0 !important; overflow: hidden !important; }
    }

    /* Ensure dark mode logos are hidden by default (light mode) */
    .dark-logo, .footer-dark-logo {
      display: none !important;
      max-height: 0 !important;
      overflow: hidden !important;
    }

    /* Gmail-specific dark mode */
    [data-ogsc] .dark-logo, 
    [data-ogsc] .footer-dark-logo { display: inline-block !important; max-height: none !important; }
    [data-ogsc] .light-logo,
    [data-ogsc] .footer-light-logo { display: none !important; }
  </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Preheader text (hidden) -->
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Message from MazeX
  </div>

  <!-- Email wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="body-bg" style="background-color: #f4f4f5;">
    <tr>
      <td class="email-wrapper" style="padding: 40px 20px;">
        
        <!-- Main container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td class="header-cell border-color" style="padding: 28px 32px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">
              <!-- Light mode logo -->
              <img class="light-logo" src="${assets.mazexLogo}" alt="MazeX" width="120" style="display: inline-block; height: auto; max-height: 40px; width: auto; max-width: 120px;" />
              <!-- Dark mode logo -->
              <img class="dark-logo" src="${assets.mazexLogoWhite}" alt="MazeX" width="120" style="display: none; height: auto; max-height: 40px; width: auto; max-width: 120px;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 32px 40px;">
              ${paragraphs}
              
              <!-- Footer note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 28px;">
                <tr>
                  <td class="border-color" style="padding-top: 20px; border-top: 1px solid #e4e4e7;">
                    <p class="text-muted" style="margin: 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                      Sent from the MazeX admin panel.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer with Knurdz logo -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" class="email-container" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              <!-- Light mode footer logo -->
              <img class="footer-light-logo" src="${assets.knurdzPoweredByLight}" alt="Powered by Knurdz" height="24" style="display: inline-block; height: 24px; width: auto;" />
              <!-- Dark mode footer logo -->
              <img class="footer-dark-logo" src="${assets.knurdzPoweredBy}" alt="Powered by Knurdz" height="24" style="display: none; height: 24px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding-bottom: 16px;">
              <p class="text-muted" style="margin: 0; font-size: 12px; color: #71717a;">
                This is an automated message from MazeX.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function listRegistrationEmailContacts() {
  try {
    const contacts = (await listAllRegistrationContactDocuments())
      .map(mapRegistrationContactDoc)
      .filter((contact): contact is RegistrationEmailContact => contact !== null);

    return sortContacts(contacts);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return [];
    }

    throw error;
  }
}

export async function syncRegistrationEmailContact(params: {
  email: string;
  name: string | null;
  lastFormId: string | null;
  lastFormTitle: string | null;
  lastSubmissionId: string | null;
  lastSubmittedAt: string | null;
}) {
  const normalizedEmail = normalizeEmailAddress(params.email);
  if (!normalizedEmail) {
    throw new Error("Cannot sync a registration contact without an email address.");
  }

  const normalizedName = trimNullable(params.name);
  const existingContactDoc = await getRegistrationContactDocumentByEmail(normalizedEmail);
  const existingContact = existingContactDoc
    ? mapRegistrationContactDoc(existingContactDoc)
    : null;
  const user = await ensureRegistrationContactUser({
    email: normalizedEmail,
    name: normalizedName,
    existingUserId: existingContact?.userId ?? null,
  });
  const target = await ensureRegistrationContactTarget({
    userId: user.$id,
    email: normalizedEmail,
    name: normalizedName,
    existingTargetId: existingContact?.targetId ?? null,
  });

  await ensureContactTopicSubscription({
    email: normalizedEmail,
    targetId: target.$id,
  });

  const contactDoc = await upsertRegistrationContactDocument({
    email: normalizedEmail,
    name: normalizedName ?? trimNullable(user.name),
    userId: user.$id,
    targetId: target.$id,
    lastFormId: params.lastFormId,
    lastFormTitle: params.lastFormTitle,
    lastSubmissionId: params.lastSubmissionId,
    lastSubmittedAt: params.lastSubmittedAt,
  });

  const mappedContact = mapRegistrationContactDoc(contactDoc);
  if (!mappedContact) {
    throw new Error(`The synced contact for ${normalizedEmail} could not be read back.`);
  }

  return mappedContact;
}

export async function sendRegistrationContactsEmail(params: {
  subject: string;
  content: string;
  recipientTargetIds?: string[];
  sendToAll?: boolean;
}) {
  const subject = trim(params.subject);
  const content = trim(params.content);

  if (!subject) {
    throw new Error("Enter an email subject.");
  }

  if (!content) {
    throw new Error("Enter the email content.");
  }

  const messaging = createMessagingService();
  const targets = Array.from(
    new Set((params.recipientTargetIds ?? []).map((targetId) => trim(targetId)).filter(Boolean)),
  );

  if (!params.sendToAll && targets.length === 0) {
    throw new Error("Choose at least one contact to email.");
  }

  const message = await messaging.createEmail({
    messageId: ID.unique(),
    subject,
    content: buildCustomEmailHtml(content),
    html: true,
    topics: params.sendToAll ? [await ensureContactsTopicExists()] : undefined,
    targets: params.sendToAll ? undefined : targets,
  });

  return message;
}
