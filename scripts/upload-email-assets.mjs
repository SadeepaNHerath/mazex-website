#!/usr/bin/env node
// scripts/upload-email-assets.mjs
// Run: node scripts/upload-email-assets.mjs
// Uploads email logo assets to Appwrite storage bucket

import { Client, Storage, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file
const envPath = resolve(__dirname, "../.env");
if (!existsSync(envPath)) {
  console.error("❌  .env file not found");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const ENDPOINT = env.APPWRITE_ENDPOINT;
const PROJECT_ID = env.APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const BUCKET_ID = env.APPWRITE_BUCKET_EMAIL_ASSETS || "email_assets";

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("❌  Missing required Appwrite env vars (APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY)");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const storage = new Storage(client);

// Define assets to upload with their target IDs (for consistent URLs)
const ASSETS = [
  {
    fileId: "mazex-logo",
    localPath: "public/images/brand/logo.svg",
    description: "MazeX Logo (Light Mode)",
  },
  {
    fileId: "mazex-logo-white",
    localPath: "public/images/brand/logo-white.svg",
    description: "MazeX Logo (Dark Mode - White)",
  },
  {
    fileId: "knurdz-poweredby",
    localPath: "public/images/knurdz/knurdz-poweredby.svg",
    description: "Knurdz Powered By (Dark Mode)",
  },
  {
    fileId: "knurdz-poweredby-light",
    localPath: "public/images/knurdz/knurdz-poweredby-light.svg",
    description: "Knurdz Powered By (Light Mode)",
  },
];

async function ensureBucketExists() {
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`✓ Bucket "${BUCKET_ID}" exists`);
  } catch (e) {
    if (e?.code === 404) {
      console.log(`Creating bucket "${BUCKET_ID}"...`);
      await storage.createBucket(
        BUCKET_ID,
        "Email Assets",
        ['read("any")'],
        false, // fileSecurity
        true,  // enabled
        1048576, // 1MB max
        ["png", "jpg", "jpeg", "webp", "svg", "gif"],
        "none", // compression
        false,  // encryption
        true    // antivirus
      );
      console.log(`✓ Bucket "${BUCKET_ID}" created`);
    } else {
      throw e;
    }
  }
}

async function uploadAsset(asset) {
  const filePath = resolve(__dirname, "..", asset.localPath);
  
  if (!existsSync(filePath)) {
    console.error(`❌  File not found: ${asset.localPath}`);
    return null;
  }

  const fileBuffer = readFileSync(filePath);
  const fileName = asset.localPath.split("/").pop();

  // Check if file already exists and delete it
  try {
    await storage.getFile(BUCKET_ID, asset.fileId);
    console.log(`  Deleting existing file: ${asset.fileId}...`);
    await storage.deleteFile(BUCKET_ID, asset.fileId);
  } catch (e) {
    // File doesn't exist, that's fine
    if (e?.code !== 404) {
      console.warn(`  Warning checking file: ${e.message}`);
    }
  }

  // Upload file with specific ID
  const inputFile = InputFile.fromBuffer(fileBuffer, fileName);
  const uploaded = await storage.createFile(BUCKET_ID, asset.fileId, inputFile);
  
  const url = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${PROJECT_ID}`;
  
  console.log(`✓ ${asset.description}`);
  console.log(`  ID: ${uploaded.$id}`);
  console.log(`  URL: ${url}`);
  
  return { ...asset, url, id: uploaded.$id };
}

async function main() {
  console.log("\n📧 Uploading Email Assets to Appwrite Storage\n");
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Bucket: ${BUCKET_ID}\n`);

  await ensureBucketExists();
  console.log("");

  const results = [];
  for (const asset of ASSETS) {
    try {
      const result = await uploadAsset(asset);
      if (result) results.push(result);
      console.log("");
    } catch (e) {
      console.error(`❌  Failed to upload ${asset.description}: ${e.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📋 Email Asset URLs for Templates:");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  for (const r of results) {
    console.log(`${r.description}:`);
    console.log(`  ${r.url}\n`);
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("\nAdd these to your .env file:\n");
  console.log(`APPWRITE_BUCKET_EMAIL_ASSETS=${BUCKET_ID}`);
  console.log("\nThe email templates will automatically use these URLs.");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("❌  Error:", e.message);
  process.exit(1);
});
