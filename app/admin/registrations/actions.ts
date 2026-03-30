"use server";

import { AppwriteException } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { AppwriteConfigError } from "@/lib/appwrite";
import {
  createRegistrationField,
  createRegistrationForm,
  deleteFormBanner,
  deleteRegistrationField,
  deleteRegistrationForm,
  getRegistrationFormById,
  isChoiceField,
  isTextLikeField,
  listRegistrationForms,
  parseOptionsFromText,
  updateRegistrationField,
  bulkSaveRegistrationFields,
  updateRegistrationFieldOrders,
  updateRegistrationFormSettings,
  uploadFormBanner,
} from "@/lib/registrations";
import type {
  FieldDefinition,
  FieldOption,
  FieldScope,
  FieldType,
  FieldValidation,
  RegistrationFormKind,
  RegistrationFormStatus,
} from "@/lib/registration-types";
import {
  MAX_REGISTRATION_FORMS,
  REGISTRATION_FIELD_SCOPES,
  REGISTRATION_FIELD_TYPES,
  REGISTRATION_FORM_KINDS,
  REGISTRATION_FORM_STATUSES,
  RESERVED_SLUGS,
} from "@/lib/registration-types";

// ─── State type ───────────────────────────────────────────────────────────────

export type RegistrationAdminActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  toastKey: number;
};

const initialState: RegistrationAdminActionState = {
  status: "idle",
  message: null,
  toastKey: 0,
};

function buildState(
  status: RegistrationAdminActionState["status"],
  message: string | null,
): RegistrationAdminActionState {
  return { status, message, toastKey: Date.now() };
}

// ─── Type guards ──────────────────────────────────────────────────────────────

function isFieldScope(v: unknown): v is FieldScope {
  return (
    typeof v === "string" && REGISTRATION_FIELD_SCOPES.includes(v as FieldScope)
  );
}

function isFieldType(v: unknown): v is FieldType {
  return (
    typeof v === "string" && REGISTRATION_FIELD_TYPES.includes(v as FieldType)
  );
}

function isStatus(v: unknown): v is RegistrationFormStatus {
  return (
    typeof v === "string" &&
    REGISTRATION_FORM_STATUSES.includes(v as RegistrationFormStatus)
  );
}

function isFormKind(v: unknown): v is RegistrationFormKind {
  return (
    typeof v === "string" &&
    REGISTRATION_FORM_KINDS.includes(v as RegistrationFormKind)
  );
}


// ─── FormData helpers ─────────────────────────────────────────────────────────

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : null;
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function parseOptionalNumber(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function parseOptionalDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

// ─── Slug validation ──────────────────────────────────────────────────────────

function validateSlug(slug: string): string | null {
  if (!slug) return "Enter a slug.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return "Slug must be lowercase letters, numbers, and hyphens only (e.g. competition-2026).";
  if (RESERVED_SLUGS.has(slug))
    return `"${slug}" is a reserved path and cannot be used as a slug.`;
  return null;
}

// ─── Guard: require admin session ─────────────────────────────────────────────

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Your admin session has expired. Sign in again.");
  return admin;
}

// ─── Revalidation ─────────────────────────────────────────────────────────────

function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/form-builder");
  revalidatePath("/admin/registrations");
  if (slug) revalidatePath(`/${slug}`);
}

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(error: unknown): RegistrationAdminActionState {
  if (error instanceof AppwriteException) {
    if (error.code === 404)
      return buildState(
        "error",
        "Collection not found. Run 'appwrite push collections' to set up the database.",
      );
    if ([401, 403].includes(error.code ?? 0))
      return buildState(
        "error",
        "The Appwrite API key needs databases.read and databases.write scopes.",
      );
    if (error.code === 409)
      return buildState(
        "error",
        "A form with this slug already exists. Choose a different slug.",
      );
    return buildState("error", error.message || "An Appwrite error occurred.");
  }
  if (error instanceof AppwriteConfigError) return buildState("error", error.message);
  return buildState(
    "error",
    error instanceof Error ? error.message : "An unexpected error occurred.",
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

export async function createRegistrationFormAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();

    const slug = readString(formData, "slug");
    const slugError = validateSlug(slug);
    if (slugError) throw new Error(slugError);

    const title = readString(formData, "title");
    if (!title) throw new Error("Enter a form title.");

    const kindValue = readString(formData, "kind");
    if (!isFormKind(kindValue)) throw new Error("Choose a valid form kind.");

    const existingForms = await listRegistrationForms();
    if (existingForms.length >= MAX_REGISTRATION_FORMS)
      throw new Error(
        `You can only create up to ${MAX_REGISTRATION_FORMS} registration forms.`,
      );

    const sortOrder = existingForms.length;
    await createRegistrationForm({
      slug,
      title,
      description: readOptionalString(formData, "description"),
      kind: kindValue,
      sortOrder,
    });

    revalidateAll(slug);
    return buildState("success", `Form "${title}" created successfully.`);
  } catch (error) {
    return handleError(error);
  }
}

// ─── Delete form ──────────────────────────────────────────────────────────────

export async function deleteRegistrationFormAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    const formId = readString(formData, "formId");
    if (!formId) throw new Error("Unable to identify the form.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    await deleteRegistrationForm(formId);
    revalidateAll(form.slug);
    return buildState("success", `Form "${form.title}" deleted.`);
  } catch (error) {
    return handleError(error);
  }
}

// ─── Update form settings ─────────────────────────────────────────────────────

export async function updateRegistrationFormSettingsAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();

    const formId = readString(formData, "formId");
    if (!formId) throw new Error("Unable to determine which form to update.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    const slug = readString(formData, "slug");
    const slugError = validateSlug(slug);
    if (slugError) throw new Error(slugError);

    const title = readString(formData, "title");
    if (!title) throw new Error("Enter a form title.");

    const statusValue = readString(formData, "status");
    if (!isStatus(statusValue)) throw new Error("Choose a valid form status.");

    const openAt = parseOptionalDateTime(readString(formData, "openAt"));
    const closeAt = parseOptionalDateTime(readString(formData, "closeAt"));
    const openAtRaw = readString(formData, "openAt");
    const closeAtRaw = readString(formData, "closeAt");

    if (openAtRaw && !openAt) throw new Error("Enter a valid open date and time.");
    if (closeAtRaw && !closeAt) throw new Error("Enter a valid close date and time.");
    if (openAt && closeAt && new Date(openAt) > new Date(closeAt))
      throw new Error("Open date must be before close date.");

    const isCompetition = form.kind === "competition";
    const teamMinMembers = isCompetition
      ? parseInteger(readString(formData, "teamMinMembers"), Number.NaN)
      : 1;
    const teamMaxMembers = isCompetition
      ? parseInteger(readString(formData, "teamMaxMembers"), Number.NaN)
      : 1;

    if (isCompetition) {
      if (!Number.isInteger(teamMinMembers) || teamMinMembers < 1)
        throw new Error("Minimum team members must be at least 1.");
      if (!Number.isInteger(teamMaxMembers) || teamMaxMembers < teamMinMembers)
        throw new Error(
          "Maximum team members must be at least equal to the minimum.",
        );
    }

    await updateRegistrationFormSettings({
      formId: form.id,
      slug,
      title,
      description: readOptionalString(formData, "description"),
      status: statusValue,
      openAt,
      closeAt,
      successMessage: readOptionalString(formData, "successMessage"),
      teamMinMembers,
      teamMaxMembers,
    });

    revalidateAll(slug);
    if (form.slug !== slug) revalidatePath(`/${form.slug}`);

    return buildState("success", "Form settings saved.");
  } catch (error) {
    return handleError(error);
  }
}

// ─── Upload banner ────────────────────────────────────────────────────────────

export async function uploadFormBannerAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();

    const formId = readString(formData, "formId");
    if (!formId) throw new Error("Unable to identify the form.");

    const file = formData.get("banner");
    if (!(file instanceof File) || file.size === 0)
      throw new Error("Select an image file to upload.");

    if (file.size > 5 * 1024 * 1024)
      throw new Error("Banner image must be smaller than 5 MB.");

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/avif"];
    if (!allowed.includes(file.type))
      throw new Error("Only PNG, JPEG, WebP, or AVIF images are accepted.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    await uploadFormBanner(formId, file);
    revalidateAll(form.slug);
    return buildState("success", "Banner uploaded.");
  } catch (error) {
    return handleError(error);
  }
}

// ─── Delete banner ────────────────────────────────────────────────────────────

export async function deleteFormBannerAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    const formId = readString(formData, "formId");
    if (!formId) throw new Error("Unable to identify the form.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    await deleteFormBanner(formId);
    revalidateAll(form.slug);
    return buildState("success", "Banner removed.");
  } catch (error) {
    return handleError(error);
  }
}

// ─── Field actions ────────────────────────────────────────────────────────────

function parseFieldDefinitionInput(formData: FormData) {
  const formId = readString(formData, "formId");
  const scopeValue = readString(formData, "scope");
  const typeValue = readString(formData, "type");
  const rawKey = readString(formData, "key").toLowerCase();
  const label = readString(formData, "label");
  const sortOrderValue = readString(formData, "sortOrder");
  const optionsText = readString(formData, "optionsText");
  const required = formData.get("required") === "on";

  if (!formId) throw new Error("Unable to determine which form to update.");
  if (!isFieldScope(scopeValue)) throw new Error("Choose a valid field scope.");
  if (!isFieldType(typeValue)) throw new Error("Choose a valid field type.");

  const key = rawKey.replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!/^[a-z][a-z0-9_]*$/.test(key))
    throw new Error(
      "Field key must start with a letter and use only lowercase letters, numbers, or underscores.",
    );
  if (!label) throw new Error("Enter a field label.");

  const sortOrder = parseInteger(sortOrderValue, Number.NaN);
  if (!Number.isInteger(sortOrder) || sortOrder < 0)
    throw new Error("Sort order must be a whole number ≥ 0.");

  const options = parseOptionsFromText(optionsText);
  const validation: FieldValidation = {};

  if (isChoiceField(typeValue) && options.length === 0)
    throw new Error("Add at least one option for select or radio fields.");

  const minLength = parseOptionalNumber(formData, "minLength");
  const maxLength = parseOptionalNumber(formData, "maxLength");
  const minValue = parseOptionalNumber(formData, "minValue");
  const maxValue = parseOptionalNumber(formData, "maxValue");

  if (
    (typeValue === "text" || typeValue === "textarea" || isTextLikeField(typeValue)) &&
    minLength !== undefined
  ) {
    if (!Number.isInteger(minLength) || minLength < 0)
      throw new Error("Minimum length must be a whole number ≥ 0.");
    validation.minLength = minLength;
  }
  if (
    (typeValue === "text" || typeValue === "textarea" || isTextLikeField(typeValue)) &&
    maxLength !== undefined
  ) {
    if (!Number.isInteger(maxLength) || maxLength < 0)
      throw new Error("Maximum length must be a whole number ≥ 0.");
    validation.maxLength = maxLength;
  }
  if (typeValue === "number" && minValue !== undefined) {
    if (!Number.isFinite(minValue)) throw new Error("Minimum value must be a valid number.");
    validation.min = minValue;
  }
  if (typeValue === "number" && maxValue !== undefined) {
    if (!Number.isFinite(maxValue)) throw new Error("Maximum value must be a valid number.");
    validation.max = maxValue;
  }
  if (
    typeof validation.minLength === "number" &&
    typeof validation.maxLength === "number" &&
    validation.minLength > validation.maxLength
  )
    throw new Error("Minimum length cannot exceed maximum length.");
  if (
    typeof validation.min === "number" &&
    typeof validation.max === "number" &&
    validation.min > validation.max
  )
    throw new Error("Minimum value cannot exceed maximum value.");

  return {
    formId,
    scope: scopeValue,
    key,
    label,
    type: typeValue,
    required,
    sortOrder,
    placeholder: readOptionalString(formData, "placeholder"),
    helpText: readOptionalString(formData, "helpText"),
    options,
    validation,
  };
}

function ensureUniqueKey(fields: FieldDefinition[], next: FieldDefinition) {
  const conflict = fields.find(
    (f) => f.id !== next.id && f.scope === next.scope && f.key === next.key,
  );
  if (conflict)
    throw new Error(
      `A ${next.scope} field with key "${next.key}" already exists.`,
    );
}

export async function createRegistrationFieldAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    const input = parseFieldDefinitionInput(formData);
    const form = await getRegistrationFormById(input.formId);
    if (!form) throw new Error("Form not found.");
    ensureUniqueKey(form.fields, { ...input, id: "__new__" });
    await createRegistrationField(input);
    revalidateAll(form.slug);
    return buildState("success", "Field added.");
  } catch (error) {
    return handleError(error);
  }
}

export async function updateRegistrationFieldAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    const fieldId = readString(formData, "fieldId");
    if (!fieldId) throw new Error("Unable to identify the field.");

    const input = parseFieldDefinitionInput(formData);
    const form = await getRegistrationFormById(input.formId);
    if (!form) throw new Error("Form not found.");

    const existing = form.fields.find((f) => f.id === fieldId);
    if (!existing) throw new Error("Field not found.");

    const next: FieldDefinition = { ...existing, ...input, id: fieldId };
    const nextFields = form.fields.map((f) => (f.id === fieldId ? next : f));
    ensureUniqueKey(nextFields, next);

    await updateRegistrationField({ fieldId, ...input });
    revalidateAll(form.slug);
    return buildState("success", "Field updated.");
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRegistrationFieldAction(
  _prev: RegistrationAdminActionState = initialState,
  formData: FormData,
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    const formId = readString(formData, "formId");
    const fieldId = readString(formData, "fieldId");
    if (!formId || !fieldId) throw new Error("Unable to identify the field.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    await deleteRegistrationField(fieldId);
    revalidateAll(form.slug);
    return buildState("success", "Field removed.");
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderRegistrationFieldsAction(
  formId: string,
  updates: { id: string; sortOrder: number }[],
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    if (!formId) throw new Error("Unable to identify the form.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    await updateRegistrationFieldOrders(updates);
    revalidateAll(form.slug);
    return buildState("success", "Field order updated.");
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkSaveRegistrationFieldsAction(
  formId: string,
  fields: {
    id: string; // "draft-..." or real ID
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
  }[]
): Promise<RegistrationAdminActionState> {
  try {
    await requireAdmin();
    if (!formId) throw new Error("Unable to identify the form.");

    const form = await getRegistrationFormById(formId);
    if (!form) throw new Error("Form not found.");

    // Validate unique keys across all submitted fields
    const keys = new Set<string>();
    for (const f of fields) {
      const scopeKey = `${f.scope}:${f.key}`;
      if (keys.has(scopeKey)) {
        throw new Error(`Duplicate key "${f.key}" found in ${f.scope} fields.`);
      }
      keys.add(scopeKey);
    }

    const creates = [];
    const updates = [];
    const incomingIds = new Set(fields.map(f => f.id));

    for (const f of fields) {
      if (f.id.startsWith("draft-")) {
        creates.push(f);
      } else {
        updates.push({ ...f, fieldId: f.id });
      }
    }

    // Deletions: fields in the DB that are not in the incoming payload
    const deletes = form.fields
      .map(f => f.id)
      .filter(id => !incomingIds.has(id));

    await bulkSaveRegistrationFields({
      formId,
      creates,
      updates,
      deletes,
    });

    revalidateAll(form.slug);
    return buildState("success", "Form fields saved successfully.");
  } catch (error) {
    return handleError(error);
  }
}
