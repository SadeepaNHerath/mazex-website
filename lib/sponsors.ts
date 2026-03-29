import "server-only";

import {
  AppwriteException,
  ID,
  Models,
  Query,
  Storage,
  TablesDB,
} from "node-appwrite";
import { unstable_noStore as noStore } from "next/cache";
import {
  AppwriteConfigError,
  createAppwriteAdminClient,
  isAppwriteConfigured,
} from "@/lib/appwrite";
import type { PublicSponsor } from "@/lib/sponsor-types";

type SponsorRow = Models.Row & {
  title?: string;
  websiteUrl?: string | null;
  imageFileId?: string;
  sortOrder?: number;
};

function createTablesDbService() {
  return new TablesDB(createAppwriteAdminClient());
}

function createStorageService() {
  return new Storage(createAppwriteAdminClient());
}

function getSponsorsConfig() {
  const databaseId = process.env.APPWRITE_DB_ID?.trim();
  const tableId = process.env.APPWRITE_TABLE_SPONSORS?.trim();
  const bucketId = process.env.APPWRITE_BUCKET_SPONSORS?.trim();

  const missingVariables = [
    !databaseId && "APPWRITE_DB_ID",
    !tableId && "APPWRITE_TABLE_SPONSORS",
    !bucketId && "APPWRITE_BUCKET_SPONSORS",
  ].filter(Boolean) as string[];

  if (missingVariables.length > 0) {
    throw new AppwriteConfigError(
      `Missing required Appwrite sponsor environment variables: ${missingVariables.join(", ")}`,
    );
  }

  return {
    databaseId: databaseId!,
    tableId: tableId!,
    bucketId: bucketId!,
  };
}

function isSponsorsConfigured() {
  try {
    getSponsorsConfig();
    return true;
  } catch {
    return false;
  }
}

function mapSponsorRow(row: SponsorRow): PublicSponsor | null {
  const title =
    typeof row.title === "string" ? row.title.trim() : "";
  const imageFileId =
    typeof row.imageFileId === "string" ? row.imageFileId.trim() : "";

  if (!title || !imageFileId) {
    return null;
  }

  return {
    id: row.$id,
    title,
    websiteUrl:
      typeof row.websiteUrl === "string" && row.websiteUrl.trim()
        ? row.websiteUrl.trim()
        : null,
    imageSrc: `/api/sponsors/${imageFileId}`,
    sortOrder:
      typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
        ? row.sortOrder
        : 0,
  };
}

export function normalizeSponsorWebsite(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
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

export async function listSponsors() {
  noStore();

  if (!isAppwriteConfigured() || !isSponsorsConfigured()) {
    return [] as PublicSponsor[];
  }

  try {
    const { databaseId, tableId } = getSponsorsConfig();
    const rows = await createTablesDbService().listRows<SponsorRow>({
      databaseId,
      tableId,
      queries: [Query.orderAsc("sortOrder"), Query.orderAsc("$createdAt")],
    });

    return rows.rows
      .map(mapSponsorRow)
      .filter((sponsor): sponsor is PublicSponsor => sponsor !== null);
  } catch (error) {
    if (error instanceof AppwriteException) {
      return [];
    }

    return [];
  }
}

export async function createSponsor(params: {
  title: string;
  websiteUrl: string | null;
  image: File;
  sortOrder: number;
}) {
  const { databaseId, tableId, bucketId } = getSponsorsConfig();
  const storage = createStorageService();
  const tablesDb = createTablesDbService();

  const uploadedFile = await storage.createFile({
    bucketId,
    fileId: ID.unique(),
    file: params.image,
    permissions: [],
  });

  try {
    return await tablesDb.createRow<SponsorRow>({
      databaseId,
      tableId,
      rowId: ID.unique(),
      permissions: [],
      data: {
        title: params.title,
        websiteUrl: params.websiteUrl,
        imageFileId: uploadedFile.$id,
        sortOrder: params.sortOrder,
      },
    });
  } catch (error) {
    try {
      await storage.deleteFile({
        bucketId,
        fileId: uploadedFile.$id,
      });
    } catch {
      // Best-effort cleanup to avoid breaking the main action flow.
    }

    throw error;
  }
}

export async function deleteSponsor(rowId: string) {
  const { bucketId, databaseId, tableId } = getSponsorsConfig();
  const tablesDb = createTablesDbService();
  const storage = createStorageService();
  const row = await tablesDb.getRow<SponsorRow>({
    databaseId,
    tableId,
    rowId,
  });

  await tablesDb.deleteRow({
    databaseId,
    tableId,
    rowId,
  });

  if (typeof row.imageFileId === "string" && row.imageFileId.trim()) {
    try {
      await storage.deleteFile({
        bucketId,
        fileId: row.imageFileId,
      });
    } catch {
      // The sponsor row is already deleted, so keep the UI flow successful.
    }
  }
}

export async function getSponsorImage(fileId: string) {
  noStore();

  const trimmedFileId = fileId.trim();

  if (!trimmedFileId || !isAppwriteConfigured() || !isSponsorsConfigured()) {
    return null;
  }

  try {
    const { bucketId } = getSponsorsConfig();
    const storage = createStorageService();
    const [file, content] = await Promise.all([
      storage.getFile({
        bucketId,
        fileId: trimmedFileId,
      }),
      storage.getFileView({
        bucketId,
        fileId: trimmedFileId,
      }),
    ]);

    return {
      buffer: Buffer.from(content),
      contentType: file.mimeType || "application/octet-stream",
      fileName: file.name,
    };
  } catch (error) {
    if (error instanceof AppwriteException) {
      return null;
    }

    return null;
  }
}
