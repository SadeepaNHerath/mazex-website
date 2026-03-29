import "server-only";

import { AppwriteException, Databases, Models } from "node-appwrite";
import {
  AppwriteConfigError,
  createAppwriteAdminClient,
  isAppwriteConfigured,
} from "@/lib/appwrite";

export const DELEGATE_BOOKLET_RESOURCE_KEY = "delegate_booklet";
export const DEFAULT_DELEGATE_BOOKLET_PATH =
  "/downloads/Delegate_booklet_dummy.pdf";

type SiteResourceDocument = Models.DefaultDocument & {
  key?: string;
  value?: string;
};

function createDatabasesService() {
  return new Databases(createAppwriteAdminClient());
}

function getSiteResourcesConfig() {
  const databaseId = process.env.APPWRITE_DB_ID?.trim();
  const collectionId = process.env.APPWRITE_COLLECTION_RESOURCES?.trim();

  const missingVariables = [
    !databaseId && "APPWRITE_DB_ID",
    !collectionId && "APPWRITE_COLLECTION_RESOURCES",
  ].filter(Boolean) as string[];

  if (missingVariables.length > 0) {
    throw new AppwriteConfigError(
      `Missing required Appwrite resource environment variables: ${missingVariables.join(", ")}`,
    );
  }

  return {
    databaseId: databaseId!,
    collectionId: collectionId!,
  };
}

function isSiteResourcesConfigured() {
  try {
    getSiteResourcesConfig();
    return true;
  } catch {
    return false;
  }
}

export function normalizeSiteResourceLink(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("/")) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export async function getSiteResourceValue(key: string) {
  if (!isAppwriteConfigured() || !isSiteResourcesConfigured()) {
    return null;
  }

  try {
    const { collectionId, databaseId } = getSiteResourcesConfig();
    const document = await createDatabasesService().getDocument<SiteResourceDocument>({
      databaseId,
      collectionId,
      documentId: key,
    });

    return typeof document.value === "string" ? document.value : null;
  } catch (error) {
    if (error instanceof AppwriteException) {
      return null;
    }

    return null;
  }
}

export async function upsertSiteResourceValue(key: string, value: string) {
  const { collectionId, databaseId } = getSiteResourcesConfig();

  return createDatabasesService().upsertDocument({
    databaseId,
    collectionId,
    documentId: key,
    data: {
      key,
      value,
    },
  });
}

export async function getDelegateBookletHref() {
  const storedValue = await getSiteResourceValue(DELEGATE_BOOKLET_RESOURCE_KEY);
  return (
    normalizeSiteResourceLink(storedValue ?? "") ??
    DEFAULT_DELEGATE_BOOKLET_PATH
  );
}
