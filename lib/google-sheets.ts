import "server-only";

import { AppwriteException, Databases, Models, Query } from "node-appwrite";
import { createAppwriteAdminClient } from "@/lib/appwrite";

const DEFAULT_CONNECTIONS_COLLECTION_ID = "google_sheets_connections";
const DEFAULT_SPREADSHEET_TITLE = "MazeX Registrations";
const SHARED_GOOGLE_SHEETS_CONNECTION_DOCUMENT_ID = "shared_google_sheets_connection";
const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive.file",
];
const GOOGLE_SHEETS_API_BASE_URL = "https://sheets.googleapis.com/v4";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USER_INFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleSheetsConnectionDoc = Models.Document & {
  adminUserId?: string;
  email?: string | null;
  refreshToken?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string | null;
};

export type GoogleSheetsConnection = {
  adminUserId: string;
  email: string | null;
  spreadsheetId: string;
  spreadsheetUrl: string | null;
};

export type GoogleSheetsConnectionRecord = GoogleSheetsConnection & {
  refreshToken: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email: string | null;
};

type GoogleSpreadsheetResponse = {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
};

export class GoogleSheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSheetsConfigError";
  }
}

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function trimNullable(value: unknown) {
  const normalized = trim(value);
  return normalized || null;
}

function getGoogleSheetsConnectionCollectionId() {
  return (
    process.env.APPWRITE_COLLECTION_GOOGLE_SHEETS_CONNECTIONS?.trim() ||
    DEFAULT_CONNECTIONS_COLLECTION_ID
  );
}

function getGoogleSheetsOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  const missing = [
    !clientId && "GOOGLE_OAUTH_CLIENT_ID",
    !clientSecret && "GOOGLE_OAUTH_CLIENT_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new GoogleSheetsConfigError(
      `Missing Google Sheets OAuth environment variables: ${missing.join(", ")}`,
    );
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
  };
}

export function isGoogleSheetsOAuthConfigured() {
  try {
    getGoogleSheetsOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

function createDatabasesService() {
  return new Databases(createAppwriteAdminClient());
}

export function getGoogleSheetsConnectionDocumentId(adminUserId: string) {
  return adminUserId.trim();
}

export function getSharedGoogleSheetsConnectionDocumentId() {
  return SHARED_GOOGLE_SHEETS_CONNECTION_DOCUMENT_ID;
}

function mapGoogleSheetsConnectionDoc(
  doc: GoogleSheetsConnectionDoc,
): GoogleSheetsConnectionRecord | null {
  const adminUserId = trim(doc.$id) || trim(doc.adminUserId);
  const refreshToken = trim(doc.refreshToken);
  const spreadsheetId = trim(doc.spreadsheetId);

  if (!adminUserId || !refreshToken || !spreadsheetId) {
    return null;
  }

  return {
    adminUserId,
    email: trimNullable(doc.email),
    refreshToken,
    spreadsheetId,
    spreadsheetUrl: trimNullable(doc.spreadsheetUrl),
  };
}

async function getGoogleSheetsConnectionDocument(
  documentId: string,
): Promise<GoogleSheetsConnectionRecord | null> {
  const normalizedDocumentId = documentId.trim();
  if (!normalizedDocumentId) return null;

  try {
    const document = await createDatabasesService().getDocument<GoogleSheetsConnectionDoc>(
      process.env.APPWRITE_DB_ID?.trim() || "mazex_data",
      getGoogleSheetsConnectionCollectionId(),
      getGoogleSheetsConnectionDocumentId(normalizedDocumentId),
    );

    return mapGoogleSheetsConnectionDoc(document);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    throw error;
  }
}

async function getLatestLegacyGoogleSheetsConnectionDocument() {
  const databaseId = process.env.APPWRITE_DB_ID?.trim() || "mazex_data";
  const collectionId = getGoogleSheetsConnectionCollectionId();
  const documents = await createDatabasesService().listDocuments<GoogleSheetsConnectionDoc>(
    databaseId,
    collectionId,
    [
      Query.orderDesc("$updatedAt"),
      Query.limit(25),
    ],
  );

  for (const document of documents.documents) {
    if (trim(document.$id) === SHARED_GOOGLE_SHEETS_CONNECTION_DOCUMENT_ID) {
      continue;
    }

    const connection = mapGoogleSheetsConnectionDoc(document);
    if (connection) {
      return connection;
    }
  }

  return null;
}

export async function getSharedGoogleSheetsConnectionRecord() {
  const sharedConnection = await getGoogleSheetsConnectionDocument(
    SHARED_GOOGLE_SHEETS_CONNECTION_DOCUMENT_ID,
  );
  if (sharedConnection) {
    return sharedConnection;
  }

  return getLatestLegacyGoogleSheetsConnectionDocument();
}

export async function getSharedGoogleSheetsConnection(): Promise<GoogleSheetsConnection | null> {
  const record = await getSharedGoogleSheetsConnectionRecord();
  if (!record) return null;

  return {
    adminUserId: record.adminUserId,
    email: record.email,
    spreadsheetId: record.spreadsheetId,
    spreadsheetUrl: record.spreadsheetUrl,
  };
}

export async function getGoogleSheetsConnectionForAdmin(
  _adminUserId: string,
): Promise<GoogleSheetsConnection | null> {
  return getSharedGoogleSheetsConnection();
}

export async function getGoogleSheetsConnectionRecordForAdmin(
  _adminUserId: string,
) {
  return getSharedGoogleSheetsConnectionRecord();
}

export async function upsertGoogleSheetsConnection(params: {
  connectionDocumentId?: string;
  adminUserId: string;
  email: string | null;
  refreshToken: string;
  spreadsheetId: string;
  spreadsheetUrl: string | null;
}) {
  const documentId = trim(params.connectionDocumentId) || SHARED_GOOGLE_SHEETS_CONNECTION_DOCUMENT_ID;
  const normalizedAdminUserId = params.adminUserId.trim() || documentId;
  if (!documentId) {
    throw new Error("Unable to save Google Sheets settings without a connection document.");
  }

  const databaseId = process.env.APPWRITE_DB_ID?.trim() || "mazex_data";
  const collectionId = getGoogleSheetsConnectionCollectionId();
  const normalizedDocumentId = getGoogleSheetsConnectionDocumentId(documentId);
  const data = {
    adminUserId: normalizedAdminUserId,
    email: params.email?.trim() || null,
    refreshToken: params.refreshToken.trim(),
    spreadsheetId: params.spreadsheetId.trim(),
    spreadsheetUrl: params.spreadsheetUrl?.trim() || null,
  };
  const databases = createDatabasesService();

  try {
    return await databases.updateDocument<GoogleSheetsConnectionDoc>(
      databaseId,
      collectionId,
      normalizedDocumentId,
      data,
    );
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
  }

  return databases.createDocument<GoogleSheetsConnectionDoc>(
    databaseId,
    collectionId,
    normalizedDocumentId,
    data,
  );
}

export function normalizeGoogleSheetsReturnToPath(
  input: string | null | undefined,
  fallback = "/admin/form-builder",
) {
  const normalized = trim(input);
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
}

export function makeLegacyGoogleSheetsSheetTitle(
  formTitle: string,
  formSlug: string,
) {
  const normalizedTitle = trim(formTitle) || "Registration";
  const normalizedSlug = trim(formSlug) || "form";
  return sanitizeGoogleSheetsSheetTitle(`${normalizedTitle} - ${normalizedSlug}`);
}

export function makeDefaultGoogleSheetsSheetTitle(formTitle: string, _formSlug: string) {
  const normalizedTitle = trim(formTitle) || "Registration";
  return sanitizeGoogleSheetsSheetTitle(normalizedTitle);
}

export function sanitizeGoogleSheetsSheetTitle(value: string) {
  const sanitized = value
    .replace(/[\\/*?:[\]]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^'+|'+$/gu, "");

  if (!sanitized) {
    return "Registration Sync";
  }

  return sanitized.slice(0, 100).trim() || "Registration Sync";
}

export function buildGoogleSheetsOAuthUrl(params: {
  redirectUri: string;
  state: string;
}) {
  const { clientId } = getGoogleSheetsOAuthConfig();
  const url = new URL(GOOGLE_OAUTH_AUTH_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", params.state);

  return url.toString();
}

async function readGoogleResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function extractGoogleErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = "error" in payload ? trim((payload as { error?: unknown }).error) : "";
  const errorDescription =
    "error_description" in payload
      ? trim((payload as { error_description?: unknown }).error_description)
      : "";
  const message =
    "message" in payload ? trim((payload as { message?: unknown }).message) : "";

  return errorDescription || message || error || fallback;
}

async function requestGoogleToken(params: URLSearchParams) {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });
  const payload = (await readGoogleResponse(response)) as GoogleTokenResponse | null;

  if (!response.ok) {
    throw new Error(
      extractGoogleErrorMessage(payload, "Google rejected the OAuth token request."),
    );
  }

  if (!payload?.access_token) {
    throw new Error("Google did not return a valid access token.");
  }

  return payload;
}

export async function exchangeGoogleOAuthCode(params: {
  code: string;
  redirectUri: string;
}) {
  const { clientId, clientSecret } = getGoogleSheetsOAuthConfig();

  return requestGoogleToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: params.redirectUri,
    }),
  );
}

export async function refreshGoogleSheetsAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleSheetsOAuthConfig();

  return requestGoogleToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = await readGoogleResponse(response);

  if (!response.ok) {
    throw new Error(
      extractGoogleErrorMessage(payload, "Unable to read the connected Google account."),
    );
  }

  return {
    email:
      payload && typeof payload === "object" && "email" in payload
        ? trimNullable((payload as { email?: unknown }).email)
        : null,
  };
}

async function fetchGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<GoogleSpreadsheetResponse | null> {
  const response = await fetch(
    `${GOOGLE_SHEETS_API_BASE_URL}/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}?fields=spreadsheetId,spreadsheetUrl`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 403 || response.status === 404) {
    return null;
  }

  const payload = (await readGoogleResponse(response)) as GoogleSpreadsheetResponse | null;
  if (!response.ok) {
    throw new Error(
      extractGoogleErrorMessage(payload, "Unable to load the Google spreadsheet."),
    );
  }

  return payload;
}

async function createGoogleSpreadsheet(accessToken: string) {
  const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}/spreadsheets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: DEFAULT_SPREADSHEET_TITLE,
      },
    }),
    cache: "no-store",
  });
  const payload = (await readGoogleResponse(response)) as GoogleSpreadsheetResponse | null;

  if (!response.ok) {
    throw new Error(
      extractGoogleErrorMessage(payload, "Unable to create the Google spreadsheet."),
    );
  }

  const spreadsheetId = trim(payload?.spreadsheetId);
  if (!spreadsheetId) {
    throw new Error("Google created the spreadsheet without returning its ID.");
  }

  return {
    spreadsheetId,
    spreadsheetUrl: trimNullable(payload?.spreadsheetUrl),
  };
}

export async function ensureGoogleSpreadsheetForAdmin(
  accessToken: string,
  existingSpreadsheetId: string | null | undefined,
) {
  const normalizedSpreadsheetId = trim(existingSpreadsheetId);
  if (normalizedSpreadsheetId) {
    const existing = await fetchGoogleSpreadsheet(accessToken, normalizedSpreadsheetId);
    if (existing?.spreadsheetId) {
      return {
        spreadsheetId: existing.spreadsheetId.trim(),
        spreadsheetUrl: trimNullable(existing.spreadsheetUrl),
      };
    }
  }

  return createGoogleSpreadsheet(accessToken);
}
