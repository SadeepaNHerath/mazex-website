#!/usr/bin/env node
// scripts/setup-appwrite-finish.mjs
// Adds missing indexes and the form_banners bucket.

import { Client, Databases, Storage } from "node-appwrite";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(resolve(__dirname, "../.env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const db = new Databases(client);
const storage = new Storage(client);
const DB_ID      = env.APPWRITE_DB_ID;
const FIELDS_COL = env.APPWRITE_COLLECTION_REGISTRATION_FIELDS  || "registration_fields";
const SUBS_COL   = env.APPWRITE_COLLECTION_REGISTRATION_SUBMISSIONS || "registration_submissions";
const BUCKET_ID  = env.APPWRITE_BUCKET_FORM_BANNERS || "form_banners";

async function ensureIndex(colId, key, type, attributes) {
  try {
    await db.getIndex(DB_ID, colId, key);
    console.log(`  ✓ index exists: ${key} on ${colId}`);
  } catch(e) {
    if (e?.code !== 404) throw e;
    await db.createIndex(DB_ID, colId, key, type, attributes);
    console.log(`  + created index: ${key} on ${colId}`);
  }
}

async function ensureBucket(id, name) {
  try {
    await storage.getBucket(id);
    console.log(`  ✓ bucket exists: ${name}`);
  } catch(e) {
    if (e?.code !== 404) throw e;
    await storage.createBucket(
      id, name,
      ['read("any")'],
      false, true,
      5 * 1024 * 1024,
      ["png", "jpg", "jpeg", "webp", "avif"],
      "gzip", true, true,
    );
    console.log(`  + created bucket: ${name}`);
  }
}

console.log("\n🔧  Finishing Appwrite setup\n");

// Add missing indexes (registration_forms slug_unique already exists from first run)
await ensureIndex(FIELDS_COL, "by_form", "key", ["formId"]);
await ensureIndex(SUBS_COL,   "by_form", "key", ["formId"]);

// Create form_banners bucket
await ensureBucket(BUCKET_ID, "Form Banners");

console.log("\n✅  Done — Appwrite schema is fully ready.\n");
