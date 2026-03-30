#!/usr/bin/env node
// scripts/migrate-remove-system-key.mjs
// Makes primaryName / primaryEmail optional (not required) in registration_submissions.
// Also removes the systemKey attribute from registration_fields (no longer used).

import { Client, Databases } from "node-appwrite";
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
const DB   = env.APPWRITE_DB_ID;
const SUBS = env.APPWRITE_COLLECTION_REGISTRATION_SUBMISSIONS || "registration_submissions";
const FLDS = env.APPWRITE_COLLECTION_REGISTRATION_FIELDS     || "registration_fields";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function attrStatus(colId, key) {
  try {
    const a = await db.getAttribute(DB, colId, key);
    return a.status; // "available" | "deleting" | "failed" etc.
  } catch (e) {
    if (e?.code === 404) return null;
    throw e;
  }
}

async function waitDeleted(colId, key, label) {
  process.stdout.write(`  ⏳ waiting for ${label} to be deleted`);
  for (let i = 0; i < 30; i++) {
    const s = await attrStatus(colId, key);
    if (s === null) { process.stdout.write(" ✓\n"); return; }
    process.stdout.write(".");
    await sleep(2000);
  }
  process.stdout.write(" ⚠ timed out\n");
}

async function waitAvailable(colId, key, label) {
  process.stdout.write(`  ⏳ waiting for ${label} to be ready`);
  for (let i = 0; i < 30; i++) {
    const s = await attrStatus(colId, key);
    if (s === "available") { process.stdout.write(" ✓\n"); return; }
    process.stdout.write(".");
    await sleep(2000);
  }
  process.stdout.write(" ⚠ timed out\n");
}

async function recreateAsOptional(colId, key, size, label) {
  // 1. Check current state
  const current = await attrStatus(colId, key);
  if (current === null) {
    // Doesn't exist — just create optional
    await db.createStringAttribute(DB, colId, key, size, false, null);
    await waitAvailable(colId, key, label);
    return;
  }

  // 2. Delete it (it's currently required)
  console.log(`  🗑  deleting ${label} (required → optional)`);
  try { await db.deleteAttribute(DB, colId, key); }
  catch (e) { if (e?.code !== 404) throw e; }
  await waitDeleted(colId, key, label);

  // 3. Recreate as optional
  console.log(`  + recreating ${label} as optional`);
  await db.createStringAttribute(DB, colId, key, size, false, null);
  await waitAvailable(colId, key, label);
}

async function removeAttr(colId, key, label) {
  const current = await attrStatus(colId, key);
  if (current === null) { console.log(`  · ${label} already absent`); return; }
  console.log(`  🗑  removing ${label}`);
  try { await db.deleteAttribute(DB, colId, key); }
  catch (e) { if (e?.code !== 404) throw e; }
  await waitDeleted(colId, key, label);
}

// ──────────────────────────────────────────────────────────────────────────────
console.log("\n🔧  Registration schema migration\n");

// 1. registration_submissions — make primaryName / primaryEmail optional
console.log("📋  registration_submissions");
await recreateAsOptional(SUBS, "primaryName",  255, "primaryName");
await recreateAsOptional(SUBS, "primaryEmail", 255, "primaryEmail");
// primaryPhone and teamName were already optional — nothing to do

// 2. registration_fields — remove unused systemKey column
console.log("\n📋  registration_fields");
await removeAttr(FLDS, "systemKey", "systemKey");

console.log("\n✅  Migration complete.\n");
