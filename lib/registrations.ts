import "server-only";

import { Databases, Storage, ID, Query, Models } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { unstable_noStore as noStore } from "next/cache";
import {
  AppwriteConfigError,
  createAppwriteAdminClient,
  isAppwriteConfigured,
} from "@/lib/appwrite";
import type {
  FieldDefinition,
  FieldOption,
  FieldScope,
  FieldType,
  FieldValidation,
  FormAvailability,
  FormCard,
  FormDefinition,
  FormWithFields,
  RegistrationFormKind,
  RegistrationFormStatus,
  RegistrationOverview,
  RegistrationOverviewItem,
  SubmissionAnswerValue,
  SubmissionDetail,
  SubmissionFilters,
  SubmissionPage,
  SubmissionPayload,
  SubmissionSummary,
} from "@/lib/registration-types";
import {
  REGISTRATION_FIELD_SCOPES,
  REGISTRATION_FIELD_TYPES,
  REGISTRATION_FORM_KINDS,
  REGISTRATION_FORM_STATUSES,
} from "@/lib/registration-types";

// ─── Document row types ──────────────────────────────────────────────────────

type FormDoc = Models.Document & {
  slug?: string;
  title?: string;
  description?: string | null;
  kind?: string;
  status?: string;
  openAt?: string | null;
  closeAt?: string | null;
  successMessage?: string | null;
  teamMinMembers?: number;
  teamMaxMembers?: number;
  bannerFileId?: string | null;
  sortOrder?: number;
};

type FieldDoc = Models.Document & {
  formId?: string;
  scope?: string;
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
  sortOrder?: number;
  placeholder?: string | null;
  helpText?: string | null;
  optionsJson?: string | null;
  validationJson?: string | null;
};

type SubmissionDoc = Models.Document & {
  formId?: string;
  primaryName?: string;
  primaryEmail?: string;
  primaryPhone?: string | null;
  teamName?: string | null;
  answersJson?: string;
  memberAnswersJson?: string | null;
  searchText?: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SUCCESS_MESSAGE =
  "Registration received successfully. We will contact you with the next steps.";
const PAGE_SIZE_DEFAULT = 20;
const MAX_ROW_PAGE_SIZE = 100;
const DISPLAY_TIME_ZONE = "Asia/Colombo";

// ─── Config helpers ──────────────────────────────────────────────────────────

function getRegistrationsConfig() {
  const databaseId = process.env.APPWRITE_DB_ID?.trim();
  const formsCollectionId = process.env.APPWRITE_COLLECTION_REGISTRATION_FORMS?.trim();
  const fieldsCollectionId = process.env.APPWRITE_COLLECTION_REGISTRATION_FIELDS?.trim();
  const submissionsCollectionId = process.env.APPWRITE_COLLECTION_REGISTRATION_SUBMISSIONS?.trim();
  const bannersBucketId = process.env.APPWRITE_BUCKET_FORM_BANNERS?.trim();

  const missing = [
    !databaseId && "APPWRITE_DB_ID",
    !formsCollectionId && "APPWRITE_COLLECTION_REGISTRATION_FORMS",
    !fieldsCollectionId && "APPWRITE_COLLECTION_REGISTRATION_FIELDS",
    !submissionsCollectionId && "APPWRITE_COLLECTION_REGISTRATION_SUBMISSIONS",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new AppwriteConfigError(
      `Missing Appwrite registration env vars: ${missing.join(", ")}`,
    );
  }

  return {
    databaseId: databaseId!,
    formsCollectionId: formsCollectionId!,
    fieldsCollectionId: fieldsCollectionId!,
    submissionsCollectionId: submissionsCollectionId!,
    bannersBucketId: bannersBucketId ?? "form_banners",
  };
}

export function isRegistrationsConfigured() {
  try {
    getRegistrationsConfig();
    return isAppwriteConfigured();
  } catch {
    return false;
  }
}

function createDatabasesService() {
  return new Databases(createAppwriteAdminClient());
}

function createStorageService() {
  return new Storage(createAppwriteAdminClient());
}

// ─── Type guards ─────────────────────────────────────────────────────────────

function isRegistrationFormKind(v: unknown): v is RegistrationFormKind {
  return typeof v === "string" && REGISTRATION_FORM_KINDS.includes(v as RegistrationFormKind);
}

function isRegistrationFormStatus(v: unknown): v is RegistrationFormStatus {
  return (
    typeof v === "string" &&
    REGISTRATION_FORM_STATUSES.includes(v as RegistrationFormStatus)
  );
}

function isFieldScope(v: unknown): v is FieldScope {
  return typeof v === "string" && REGISTRATION_FIELD_SCOPES.includes(v as FieldScope);
}

function isFieldType(v: unknown): v is FieldType {
  return typeof v === "string" && REGISTRATION_FIELD_TYPES.includes(v as FieldType);
}

// ─── String helpers ───────────────────────────────────────────────────────────

function trim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function trimNullable(v: unknown) {
  const s = trim(v);
  return s || null;
}

function parseJson<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

// ─── Option / Validation normalizers ─────────────────────────────────────────

function normalizeFieldOptions(raw: unknown): FieldOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { label?: unknown }).label === "string" &&
        typeof (item as { value?: unknown }).value === "string"
      ) {
        const label = ((item as { label: string }).label).trim();
        const value = ((item as { value: string }).value).trim();
        if (label && value) return { label, value };
      }
      return null;
    })
    .filter((x): x is FieldOption => x !== null);
}

function normalizeFieldValidation(raw: unknown): FieldValidation {
  if (!raw || typeof raw !== "object") return {};
  const v = raw as Record<string, unknown>;
  const result: FieldValidation = {};
  if (typeof v.minLength === "number" && Number.isFinite(v.minLength))
    result.minLength = v.minLength;
  if (typeof v.maxLength === "number" && Number.isFinite(v.maxLength))
    result.maxLength = v.maxLength;
  if (typeof v.min === "number" && Number.isFinite(v.min)) result.min = v.min;
  if (typeof v.max === "number" && Number.isFinite(v.max)) result.max = v.max;
  return result;
}

// ─── Document mappers ─────────────────────────────────────────────────────────

function mapFormDoc(doc: FormDoc): FormDefinition | null {
  const slug = trim(doc.slug);
  const title = trim(doc.title);
  if (!slug || !title || !isRegistrationFormKind(doc.kind)) return null;

  return {
    id: doc.$id,
    slug,
    title,
    description: trimNullable(doc.description),
    kind: doc.kind,
    status: isRegistrationFormStatus(doc.status) ? doc.status : "draft",
    openAt: trimNullable(doc.openAt),
    closeAt: trimNullable(doc.closeAt),
    successMessage: trimNullable(doc.successMessage),
    teamMinMembers:
      typeof doc.teamMinMembers === "number" && Number.isFinite(doc.teamMinMembers)
        ? doc.teamMinMembers
        : 1,
    teamMaxMembers:
      typeof doc.teamMaxMembers === "number" && Number.isFinite(doc.teamMaxMembers)
        ? doc.teamMaxMembers
        : 1,
    bannerFileId: trimNullable(doc.bannerFileId),
    sortOrder:
      typeof doc.sortOrder === "number" && Number.isFinite(doc.sortOrder)
        ? doc.sortOrder
        : 0,
  };
}

function mapFieldDoc(doc: FieldDoc): FieldDefinition | null {
  const formId = trim(doc.formId);
  const key = trim(doc.key);
  const label = trim(doc.label);
  if (!formId || !key || !label || !isFieldScope(doc.scope) || !isFieldType(doc.type))
    return null;

  return {
    id: doc.$id,
    formId,
    scope: doc.scope,
    key,
    label,
    type: doc.type,
    required: Boolean(doc.required),
    sortOrder:
      typeof doc.sortOrder === "number" && Number.isFinite(doc.sortOrder)
        ? doc.sortOrder
        : 0,
    placeholder: trimNullable(doc.placeholder),
    helpText: trimNullable(doc.helpText),
    options: normalizeFieldOptions(parseJson(doc.optionsJson, [])),
    validation: normalizeFieldValidation(parseJson(doc.validationJson, {})),
  };
}

function mapSubmissionDoc(
  doc: SubmissionDoc,
  formsById: Map<string, FormDefinition>,
): SubmissionDetail | null {
  const formId = trim(doc.formId);
  const primaryName = trim(doc.primaryName);
  const primaryEmail = trim(doc.primaryEmail);
  if (!formId || !primaryName || !primaryEmail) return null;

  const form = formsById.get(formId);
  return {
    id: doc.$id,
    formId,
    formSlug: form?.slug ?? null,
    formTitle: form?.title ?? null,
    createdAt: doc.$createdAt,
    primaryName,
    primaryEmail,
    primaryPhone: trimNullable(doc.primaryPhone),
    teamName: trimNullable(doc.teamName),
    answers: parseJson<Record<string, SubmissionAnswerValue>>(doc.answersJson, {}),
    memberAnswers: parseJson<Record<string, SubmissionAnswerValue>[]>(
      doc.memberAnswersJson,
      [],
    ),
  };
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

function sortForms(forms: FormDefinition[]) {
  return [...forms].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

function sortFields(fields: FieldDefinition[]) {
  return [...fields].sort((a, b) => {
    if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

// ─── Display helpers ─────────────────────────────────────────────────────────

function formatDisplayDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: DISPLAY_TIME_ZONE,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getFormAvailability(form: FormDefinition): FormAvailability {
  const now = new Date();
  const openAt = form.openAt ? new Date(form.openAt) : null;
  const closeAt = form.closeAt ? new Date(form.closeAt) : null;

  if (form.status === "closed") {
    return {
      state: "closed",
      label: "Closed",
      description: closeAt ? `Closed on ${formatDisplayDate(form.closeAt!)}` : null,
      isAcceptingSubmissions: false,
    };
  }

  if (openAt && now < openAt) {
    return {
      state: "upcoming",
      label: "Opens soon",
      description: `Opens ${formatDisplayDate(form.openAt!)}`,
      isAcceptingSubmissions: false,
    };
  }

  if (form.status === "draft") {
    return {
      state: "upcoming",
      label: "Coming soon",
      description: closeAt ? `Closes ${formatDisplayDate(form.closeAt!)}` : null,
      isAcceptingSubmissions: false,
    };
  }

  if (closeAt && now > closeAt) {
    return {
      state: "closed",
      label: "Closed",
      description: `Closed on ${formatDisplayDate(form.closeAt!)}`,
      isAcceptingSubmissions: false,
    };
  }

  return {
    state: "open",
    label: "Open now",
    description: closeAt ? `Closes ${formatDisplayDate(form.closeAt!)}` : null,
    isAcceptingSubmissions: true,
  };
}

// ─── Banner URL ───────────────────────────────────────────────────────────────

export function getFormBannerUrl(bannerFileId: string): string {
  const endpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "") ?? "";
  const projectId = process.env.APPWRITE_PROJECT_ID?.trim() ?? "";
  const bucketId = process.env.APPWRITE_BUCKET_FORM_BANNERS?.trim() ?? "form_banners";
  return `${endpoint}/storage/buckets/${bucketId}/files/${bannerFileId}/view?project=${projectId}`;
}

// ─── Form list ────────────────────────────────────────────────────────────────

export async function listRegistrationForms(): Promise<FormDefinition[]> {
  noStore();
  if (!isAppwriteConfigured() || !isRegistrationsConfigured()) return [];

  try {
    const { databaseId, formsCollectionId } = getRegistrationsConfig();
    const result = await createDatabasesService().listDocuments<FormDoc>(
      databaseId,
      formsCollectionId,
      [Query.limit(100)],
    );
    return sortForms(
      result.documents.map(mapFormDoc).filter((f): f is FormDefinition => f !== null),
    );
  } catch {
    return [];
  }
}

export async function listRegistrationFormCards(): Promise<FormCard[]> {
  const forms = await listRegistrationForms();
  return forms.map((form) => ({ ...form, availability: getFormAvailability(form) }));
}

// ─── Get single form ──────────────────────────────────────────────────────────

export async function getRegistrationFormBySlug(
  slug: string,
): Promise<FormWithFields | null> {
  noStore();
  const s = slug.trim();
  if (!s || !isAppwriteConfigured() || !isRegistrationsConfigured()) return null;

  try {
    const { databaseId, formsCollectionId, fieldsCollectionId } = getRegistrationsConfig();
    const db = createDatabasesService();

    const formResult = await db.listDocuments<FormDoc>(databaseId, formsCollectionId, [
      Query.equal("slug", s),
      Query.limit(1),
    ]);

    const formDoc = formResult.documents[0];
    if (!formDoc) return null;

    const form = mapFormDoc(formDoc);
    if (!form) return null;

    const fieldsResult = await db.listDocuments<FieldDoc>(
      databaseId,
      fieldsCollectionId,
      [Query.equal("formId", form.id), Query.limit(200)],
    );

    const fields = sortFields(
      fieldsResult.documents
        .map(mapFieldDoc)
        .filter((f): f is FieldDefinition => f !== null),
    );

    return { ...form, fields };
  } catch {
    return null;
  }
}

export async function getRegistrationFormById(
  formId: string,
): Promise<FormWithFields | null> {
  noStore();
  if (!formId.trim() || !isAppwriteConfigured() || !isRegistrationsConfigured())
    return null;

  try {
    const { databaseId, formsCollectionId, fieldsCollectionId } = getRegistrationsConfig();
    const db = createDatabasesService();

    const [formDoc, fieldsResult] = await Promise.all([
      db.getDocument<FormDoc>(databaseId, formsCollectionId, formId),
      db.listDocuments<FieldDoc>(databaseId, fieldsCollectionId, [
        Query.equal("formId", formId),
        Query.limit(200),
      ]),
    ]);

    const form = mapFormDoc(formDoc);
    if (!form) return null;

    const fields = sortFields(
      fieldsResult.documents
        .map(mapFieldDoc)
        .filter((f): f is FieldDefinition => f !== null),
    );

    return { ...form, fields };
  } catch {
    return null;
  }
}

// ─── Create / Delete form ─────────────────────────────────────────────────────

export async function createRegistrationForm(params: {
  slug: string;
  title: string;
  description: string | null;
  kind: RegistrationFormKind;
  sortOrder: number;
}) {
  const { databaseId, formsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().createDocument<FormDoc>(
    databaseId,
    formsCollectionId,
    ID.unique(),
    {
      slug: params.slug,
      title: params.title,
      description: params.description,
      kind: params.kind,
      status: "draft",
      openAt: null,
      closeAt: null,
      successMessage:
        "Registration received successfully. We will contact you with the next steps.",
      teamMinMembers: 1,
      teamMaxMembers: 1,
      bannerFileId: null,
      sortOrder: params.sortOrder,
    },
  );
}

export async function deleteRegistrationForm(formId: string) {
  const { databaseId, formsCollectionId, fieldsCollectionId, submissionsCollectionId } =
    getRegistrationsConfig();
  const db = createDatabasesService();

  // Delete all fields for this form
  const fieldsResult = await db.listDocuments<FieldDoc>(databaseId, fieldsCollectionId, [
    Query.equal("formId", formId),
    Query.limit(200),
  ]);
  await Promise.all(
    fieldsResult.documents.map((doc) =>
      db.deleteDocument(databaseId, fieldsCollectionId, doc.$id),
    ),
  );

  // Delete all submissions for this form
  const subsResult = await db.listDocuments<SubmissionDoc>(
    databaseId,
    submissionsCollectionId,
    [Query.equal("formId", formId), Query.limit(100)],
  );
  await Promise.all(
    subsResult.documents.map((doc) =>
      db.deleteDocument(databaseId, submissionsCollectionId, doc.$id),
    ),
  );

  // Delete the form
  return db.deleteDocument(databaseId, formsCollectionId, formId);
}

// ─── Update form settings ─────────────────────────────────────────────────────

export async function updateRegistrationFormSettings(params: {
  formId: string;
  slug: string;
  title: string;
  description: string | null;
  status: RegistrationFormStatus;
  openAt: string | null;
  closeAt: string | null;
  successMessage: string | null;
  teamMinMembers: number;
  teamMaxMembers: number;
}) {
  const { databaseId, formsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().updateDocument<FormDoc>(
    databaseId,
    formsCollectionId,
    params.formId,
    {
      slug: params.slug,
      title: params.title,
      description: params.description,
      status: params.status,
      openAt: params.openAt,
      closeAt: params.closeAt,
      successMessage: params.successMessage ?? DEFAULT_SUCCESS_MESSAGE,
      teamMinMembers: params.teamMinMembers,
      teamMaxMembers: params.teamMaxMembers,
    },
  );
}

// ─── Banner management ────────────────────────────────────────────────────────

export async function uploadFormBanner(
  formId: string,
  file: File,
): Promise<string> {
  const { databaseId, formsCollectionId, bannersBucketId } = getRegistrationsConfig();
  const storage = createStorageService();
  const db = createDatabasesService();

  // Get current form to delete old banner if it exists
  const formDoc = await db.getDocument<FormDoc>(databaseId, formsCollectionId, formId);
  if (formDoc.bannerFileId) {
    try {
      await storage.deleteFile(bannersBucketId, formDoc.bannerFileId);
    } catch {
      // Ignore — file may already be deleted
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const inputFile = InputFile.fromBuffer(buffer, file.name);
  const uploaded = await storage.createFile(bannersBucketId, ID.unique(), inputFile);

  await db.updateDocument(databaseId, formsCollectionId, formId, {
    bannerFileId: uploaded.$id,
  });

  return uploaded.$id;
}

export async function deleteFormBanner(formId: string): Promise<void> {
  const { databaseId, formsCollectionId, bannersBucketId } = getRegistrationsConfig();
  const db = createDatabasesService();
  const storage = createStorageService();

  const formDoc = await db.getDocument<FormDoc>(databaseId, formsCollectionId, formId);
  if (formDoc.bannerFileId) {
    try {
      await storage.deleteFile(bannersBucketId, formDoc.bannerFileId);
    } catch {
      // Ignore
    }
    await db.updateDocument(databaseId, formsCollectionId, formId, {
      bannerFileId: null,
    });
  }
}

// ─── Fields ───────────────────────────────────────────────────────────────────

export async function createRegistrationField(params: {
  formId: string;
  scope: FieldScope;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  sortOrder: number;
  placeholder: string | null;
  helpText: string | null;
  options: FieldOption[];
  validation: FieldValidation;
}) {
  const { databaseId, fieldsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().createDocument<FieldDoc>(
    databaseId,
    fieldsCollectionId,
    ID.unique(),
    {
      formId: params.formId,
      scope: params.scope,
      key: params.key,
      label: params.label,
      type: params.type,
      required: params.required,
      sortOrder: params.sortOrder,
      placeholder: params.placeholder,
      helpText: params.helpText,
      optionsJson: JSON.stringify(params.options),
      validationJson: JSON.stringify(params.validation),
    },
  );
}

export async function updateRegistrationField(params: {
  fieldId: string;
  formId: string;
  scope: FieldScope;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  sortOrder: number;
  placeholder: string | null;
  helpText: string | null;
  options: FieldOption[];
  validation: FieldValidation;
}) {
  const { databaseId, fieldsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().updateDocument<FieldDoc>(
    databaseId,
    fieldsCollectionId,
    params.fieldId,
    {
      formId: params.formId,
      scope: params.scope,
      key: params.key,
      label: params.label,
      type: params.type,
      required: params.required,
      sortOrder: params.sortOrder,
      placeholder: params.placeholder,
      helpText: params.helpText,
      optionsJson: JSON.stringify(params.options),
      validationJson: JSON.stringify(params.validation),
    },
  );
}

export async function deleteRegistrationField(fieldId: string) {
  const { databaseId, fieldsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().deleteDocument(databaseId, fieldsCollectionId, fieldId);
}

export async function updateRegistrationFieldOrders(updates: { id: string; sortOrder: number }[]) {
  const { databaseId, fieldsCollectionId } = getRegistrationsConfig();
  const db = createDatabasesService();
  return Promise.all(
    updates.map((update) =>
      db.updateDocument(databaseId, fieldsCollectionId, update.id, {
        sortOrder: update.sortOrder,
      })
    )
  );
}

export async function bulkSaveRegistrationFields(params: {
  formId: string;
  creates: {
    scope: FieldScope;
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    sortOrder: number;
    placeholder: string | null;
    helpText: string | null;
    options: FieldOption[];
    validation: FieldValidation;
  }[];
  updates: {
    fieldId: string;
    scope: FieldScope;
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    sortOrder: number;
    placeholder: string | null;
    helpText: string | null;
    options: FieldOption[];
    validation: FieldValidation;
  }[];
  deletes: string[];
}) {
  const { databaseId, fieldsCollectionId } = getRegistrationsConfig();
  const db = createDatabasesService();

  const createPromises = params.creates.map((c) =>
    db.createDocument<FieldDoc>(databaseId, fieldsCollectionId, ID.unique(), {
      formId: params.formId,
      scope: c.scope,
      key: c.key,
      label: c.label,
      type: c.type,
      required: c.required,
      sortOrder: c.sortOrder,
      placeholder: c.placeholder,
      helpText: c.helpText,
      optionsJson: JSON.stringify(c.options),
      validationJson: JSON.stringify(c.validation),
    })
  );

  const updatePromises = params.updates.map((u) =>
    db.updateDocument<FieldDoc>(databaseId, fieldsCollectionId, u.fieldId, {
      formId: params.formId, // Technically shouldn't change, but good for completeness
      scope: u.scope,
      key: u.key,
      label: u.label,
      type: u.type,
      required: u.required,
      sortOrder: u.sortOrder,
      placeholder: u.placeholder,
      helpText: u.helpText,
      optionsJson: JSON.stringify(u.options),
      validationJson: JSON.stringify(u.validation),
    })
  );

  const deletePromises = params.deletes.map((id) =>
    db.deleteDocument(databaseId, fieldsCollectionId, id)
  );

  await Promise.all([...createPromises, ...updatePromises, ...deletePromises]);
}

// ─── Submissions ──────────────────────────────────────────────────────────────

function buildSearchText(payload: SubmissionPayload) {
  const parts: string[] = [
    payload.primaryName,
    payload.primaryEmail,
    payload.primaryPhone ?? "",
    payload.teamName ?? "",
  ];
  const values = [
    ...Object.values(payload.answers),
    ...payload.memberAnswers.flatMap((m) => Object.values(m)),
  ];
  for (const v of values) {
    if (typeof v === "string" || typeof v === "number") parts.push(String(v));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 4000);
}

export async function createRegistrationSubmission(payload: SubmissionPayload) {
  const { databaseId, submissionsCollectionId } = getRegistrationsConfig();
  return createDatabasesService().createDocument<SubmissionDoc>(
    databaseId,
    submissionsCollectionId,
    ID.unique(),
    {
      formId: payload.formId,
      primaryName: payload.primaryName,
      primaryEmail: payload.primaryEmail,
      primaryPhone: payload.primaryPhone,
      teamName: payload.teamName,
      answersJson: JSON.stringify(payload.answers),
      memberAnswersJson: JSON.stringify(payload.memberAnswers),
      searchText: buildSearchText(payload),
    },
  );
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
    return fallback;
  return value;
}

function normalizeDateFilter(value: string | null | undefined, endOfDay = false) {
  if (!value?.trim()) return null;
  const suffix = endOfDay ? "T23:59:59.999+05:30" : "T00:00:00.000+05:30";
  const parsed = new Date(`${value.trim()}${suffix}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function getFormsByIdMap() {
  const forms = await listRegistrationForms();
  return new Map(forms.map((f) => [f.id, f] as const));
}

export async function listRegistrationSubmissions(
  filters: SubmissionFilters,
): Promise<SubmissionPage> {
  noStore();
  if (!isAppwriteConfigured() || !isRegistrationsConfigured()) {
    return {
      submissions: [],
      total: 0,
      page: normalizePositiveInteger(filters.page, 1),
      pageSize: normalizePositiveInteger(filters.pageSize, PAGE_SIZE_DEFAULT),
    };
  }

  try {
    const { databaseId, submissionsCollectionId } = getRegistrationsConfig();
    const pageSize = normalizePositiveInteger(filters.pageSize, PAGE_SIZE_DEFAULT);
    const page = normalizePositiveInteger(filters.page, 1);
    const queries: string[] = [Query.orderDesc("$createdAt")];

    if (filters.formId) queries.push(Query.equal("formId", filters.formId));

    const from = normalizeDateFilter(filters.from, false);
    const to = normalizeDateFilter(filters.to, true);
    if (from) queries.push(Query.greaterThanEqual("$createdAt", from));
    if (to) queries.push(Query.lessThanEqual("$createdAt", to));

    queries.push(Query.limit(pageSize));
    queries.push(Query.offset((page - 1) * pageSize));

    const [result, formsById] = await Promise.all([
      createDatabasesService().listDocuments<SubmissionDoc>(
        databaseId,
        submissionsCollectionId,
        queries,
      ),
      getFormsByIdMap(),
    ]);

    const submissions = result.documents
      .map((doc) => mapSubmissionDoc(doc, formsById))
      .filter((s): s is SubmissionDetail => s !== null)
      .map<SubmissionSummary>((s) => ({
        id: s.id,
        formId: s.formId,
        formSlug: s.formSlug,
        formTitle: s.formTitle,
        createdAt: s.createdAt,
        primaryName: s.primaryName,
        primaryEmail: s.primaryEmail,
        primaryPhone: s.primaryPhone,
        teamName: s.teamName,
      }));

    return {
      submissions,
      total: result.total,
      page,
      pageSize,
    };
  } catch {
    return {
      submissions: [],
      total: 0,
      page: normalizePositiveInteger(filters.page, 1),
      pageSize: normalizePositiveInteger(filters.pageSize, PAGE_SIZE_DEFAULT),
    };
  }
}

export async function listAllRegistrationSubmissionDetails(
  filters: SubmissionFilters,
): Promise<SubmissionDetail[]> {
  noStore();
  if (!isAppwriteConfigured() || !isRegistrationsConfigured()) return [];

  try {
    const { databaseId, submissionsCollectionId } = getRegistrationsConfig();
    const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(MAX_ROW_PAGE_SIZE)];
    if (filters.formId) queries.push(Query.equal("formId", filters.formId));

    const [result, formsById] = await Promise.all([
      createDatabasesService().listDocuments<SubmissionDoc>(
        databaseId,
        submissionsCollectionId,
        queries,
      ),
      getFormsByIdMap(),
    ]);

    return result.documents
      .map((doc) => mapSubmissionDoc(doc, formsById))
      .filter((s): s is SubmissionDetail => s !== null);
  } catch {
    return [];
  }
}

export async function getRegistrationSubmissionById(
  submissionId: string,
): Promise<SubmissionDetail | null> {
  noStore();
  if (!submissionId.trim() || !isAppwriteConfigured() || !isRegistrationsConfigured())
    return null;

  try {
    const { databaseId, submissionsCollectionId } = getRegistrationsConfig();
    const [doc, formsById] = await Promise.all([
      createDatabasesService().getDocument<SubmissionDoc>(
        databaseId,
        submissionsCollectionId,
        submissionId,
      ),
      getFormsByIdMap(),
    ]);
    return mapSubmissionDoc(doc, formsById);
  } catch {
    return null;
  }
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getRegistrationOverview(): Promise<RegistrationOverview> {
  noStore();
  const forms = await listRegistrationForms();
  const recentPage = await listRegistrationSubmissions({ page: 1, pageSize: 6 });

  if (!isAppwriteConfigured() || !isRegistrationsConfigured()) {
    return {
      forms: forms.map<RegistrationOverviewItem>((form) => ({
        form,
        availability: getFormAvailability(form),
        submissionCount: 0,
      })),
      totalSubmissions: 0,
      recentSubmissions: recentPage.submissions,
    };
  }

  try {
    const { databaseId, submissionsCollectionId } = getRegistrationsConfig();
    const db = createDatabasesService();

    const counts = await Promise.all(
      forms.map(async (form) => {
        const res = await db.listDocuments<SubmissionDoc>(
          databaseId,
          submissionsCollectionId,
          [Query.equal("formId", form.id), Query.limit(1)],
        );
        return { formId: form.id, total: res.total };
      }),
    );

    const countsByFormId = new Map(counts.map((c) => [c.formId, c.total] as const));
    const items = forms.map<RegistrationOverviewItem>((form) => ({
      form,
      availability: getFormAvailability(form),
      submissionCount: countsByFormId.get(form.id) ?? 0,
    }));

    return {
      forms: items,
      totalSubmissions: items.reduce((t, i) => t + i.submissionCount, 0),
      recentSubmissions: recentPage.submissions,
    };
  } catch {
    return {
      forms: forms.map((form) => ({
        form,
        availability: getFormAvailability(form),
        submissionCount: 0,
      })),
      totalSubmissions: 0,
      recentSubmissions: recentPage.submissions,
    };
  }
}

// ─── Validation / Utilities ───────────────────────────────────────────────────



export function isChoiceField(t: FieldType) {
  return t === "select" || t === "radio" || t === "checkbox";
}

export function isTextLikeField(t: FieldType) {
  return t === "text" || t === "textarea" || t === "email" || t === "tel" || t === "time";
}

export function parseOptionsFromText(value: string): FieldOption[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map<FieldOption>((line) => {
      const [rawLabel, rawValue] = line.includes("|")
        ? line.split("|", 2)
        : [line, line];
      return { label: rawLabel.trim(), value: rawValue.trim() };
    })
    .filter((o) => o.label && o.value);
}

export function formatOptionsForTextarea(options: FieldOption[]) {
  return options.map((o) => `${o.label}|${o.value}`).join("\n");
}

export function getFieldLabelMap(fields: FieldDefinition[]) {
  return new Map(fields.map((f) => [f.key, f.label] as const));
}

export function coerceFieldValue(
  field: FieldDefinition,
  rawValue: FormDataEntryValue | FormDataEntryValue[] | null,
): SubmissionAnswerValue {
  if (field.type === "checkbox") {
    if (Array.isArray(rawValue)) return rawValue.map(String);
    return rawValue ? [String(rawValue)] : [];
  }
  
  if (Array.isArray(rawValue)) rawValue = rawValue[0] ?? null;

  if (field.type === "file") {
    if (rawValue instanceof File && rawValue.size > 0) return rawValue;
    return null;
  }

  if (typeof rawValue !== "string") return null;
  const value = rawValue.trim();
  if (!value) return null;
  if (field.type === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

export function validateFieldValue(
  field: FieldDefinition,
  value: SubmissionAnswerValue,
) {
  if (field.type === "checkbox") {
    if (field.required && (!Array.isArray(value) || value.length === 0))
      return `Please select at least one option for ${field.label}.`;
    return null;
  }

  if (field.type === "file") {
    if (field.required && !(value instanceof File))
      return `${field.label} is required. Please upload a file.`;
    if (value instanceof File && value.size > 5 * 1024 * 1024)
      return `${field.label} must be less than 5MB.`;
    return null;
  }

  if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return field.required ? `${field.label} is required.` : null;
  }

  if (field.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value))
      return `${field.label} must be a valid number.`;
    if (typeof field.validation.min === "number" && value < field.validation.min)
      return `${field.label} must be at least ${field.validation.min}.`;
    if (typeof field.validation.max === "number" && value > field.validation.max)
      return `${field.label} must be at most ${field.validation.max}.`;
    return null;
  }

  if (typeof value !== "string") return `${field.label} has an invalid value.`;

  if (
    typeof field.validation.minLength === "number" &&
    value.length < field.validation.minLength
  )
    return `${field.label} must be at least ${field.validation.minLength} characters.`;

  if (
    typeof field.validation.maxLength === "number" &&
    value.length > field.validation.maxLength
  )
    return `${field.label} must be at most ${field.validation.maxLength} characters.`;

  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return `${field.label} must be a valid email address.`;

  if (field.type === "tel" && !/^[+()\-\s0-9.]{7,24}$/.test(value))
    return `${field.label} must be a valid phone number.`;

  if (isChoiceField(field.type)) {
    const allowed = new Set(field.options.map((o) => o.value));
    if (!allowed.has(value)) return `${field.label} has an invalid option.`;
  }

  return null;
}

export function getDefaultSuccessMessage(form: FormDefinition) {
  return form.successMessage || DEFAULT_SUCCESS_MESSAGE;
}
