#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client, ExecutionMethod, Functions } from "node-appwrite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const rootEnvPath = resolve(rootDir, ".env");
const functionId =
  process.env.APPWRITE_FUNCTION_RESEND_CONTACTS_ID?.trim() ||
  "registration_resend_contacts";
const batchSize = 100;
const maxBatches = 20;

function parseEnvFile(filePath) {
  const env = {};

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseResponse(responseBody) {
  const normalized = trim(responseBody);
  if (!normalized) {
    throw new Error("The Resend contacts function returned an empty response.");
  }

  try {
    const parsed = JSON.parse(normalized);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("The Resend contacts function returned an invalid JSON object.");
    }

    return parsed;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to parse the Resend contacts function response.",
    );
  }
}

const env = parseEnvFile(rootEnvPath);
const endpoint = env.APPWRITE_ENDPOINT?.trim();
const projectId = env.APPWRITE_PROJECT_ID?.trim();
const apiKey = env.APPWRITE_API_KEY?.trim();

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY.");
  process.exit(1);
}

const functions = new Functions(
  new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey),
);

let cursorAfter = "";
let totalProcessed = 0;
let totalSynced = 0;
let totalSkipped = 0;
let totalFailed = 0;
let hasMore = false;

for (let index = 0; index < maxBatches; index += 1) {
  const execution = await functions.createExecution({
    functionId,
    async: false,
    method: ExecutionMethod.POST,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "sync-existing-submissions",
      batchSize,
      cursorAfter,
    }),
  });

  const response = parseResponse(execution.responseBody);
  const fallbackMessage =
    trim(response?.message) ||
    trim(execution.errors) ||
    trim(execution.responseBody) ||
    "The Resend contacts function did not return a usable response.";

  if (
    execution.status !== "completed" ||
    execution.responseStatusCode >= 400 ||
    !response?.ok
  ) {
    throw new Error(fallbackMessage);
  }

  const processedCount = getNumber(response.processedCount);
  const syncedCount = getNumber(response.syncedCount);
  const skippedCount = getNumber(response.skippedCount);
  const failedCount = getNumber(response.failedCount);

  totalProcessed += processedCount;
  totalSynced += syncedCount;
  totalSkipped += skippedCount;
  totalFailed += failedCount;
  hasMore = Boolean(response.hasMore);
  cursorAfter = trim(response.nextCursor);

  console.log(
    `Batch ${index + 1}: processed ${processedCount}, synced ${syncedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
  );

  if (!hasMore || !cursorAfter) {
    break;
  }
}

console.log("");
console.log("Registration Resend backfill complete.");
console.log(`Processed submissions: ${totalProcessed}`);
console.log(`Synced submissions: ${totalSynced}`);
console.log(`Skipped submissions: ${totalSkipped}`);
console.log(`Failed submissions: ${totalFailed}`);
console.log(`More submissions remaining: ${hasMore && Boolean(cursorAfter) ? "yes" : "no"}`);
