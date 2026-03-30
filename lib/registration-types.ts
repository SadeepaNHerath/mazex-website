export const REGISTRATION_FORM_KINDS = ["competition", "workshop"] as const;
export const REGISTRATION_FORM_STATUSES = ["draft", "open", "closed"] as const;
export const REGISTRATION_FIELD_SCOPES = ["submission", "member"] as const;
export const REGISTRATION_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "tel",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "time",
  "file"
] as const;

export type RegistrationFormKind = (typeof REGISTRATION_FORM_KINDS)[number];
export type RegistrationFormStatus = (typeof REGISTRATION_FORM_STATUSES)[number];
export type FieldScope = (typeof REGISTRATION_FIELD_SCOPES)[number];
export type FieldType = (typeof REGISTRATION_FIELD_TYPES)[number];

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

export type FieldDefinition = {
  id: string;
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
};

export type FormDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: RegistrationFormKind;
  status: RegistrationFormStatus;
  openAt: string | null;
  closeAt: string | null;
  successMessage: string | null;
  teamMinMembers: number;
  teamMaxMembers: number;
  bannerFileId: string | null;
  sortOrder: number;
};

export type FormWithFields = FormDefinition & {
  fields: FieldDefinition[];
};

export type FormAvailabilityState = "open" | "upcoming" | "closed";

export type FormAvailability = {
  state: FormAvailabilityState;
  label: string;
  description: string | null;
  isAcceptingSubmissions: boolean;
};

export type FormCard = FormDefinition & {
  availability: FormAvailability;
};

export type SubmissionAnswerValue = string | number | boolean | null | string[] | File;
export type SubmissionAnswers = Record<string, SubmissionAnswerValue>;

export type SubmissionPayload = {
  formId: string;
  answers: SubmissionAnswers;
  memberAnswers: SubmissionAnswers[];
  primaryName: string;
  primaryEmail: string;
  primaryPhone: string | null;
  teamName: string | null;
};

export type SubmissionSummary = {
  id: string;
  formId: string;
  formSlug: string | null;
  formTitle: string | null;
  createdAt: string;
  primaryName: string;
  primaryEmail: string;
  primaryPhone: string | null;
  teamName: string | null;
};

export type SubmissionDetail = SubmissionSummary & {
  answers: SubmissionAnswers;
  memberAnswers: SubmissionAnswers[];
};

export type RegistrationOverviewItem = {
  form: FormDefinition;
  availability: FormAvailability;
  submissionCount: number;
};

export type RegistrationOverview = {
  forms: RegistrationOverviewItem[];
  totalSubmissions: number;
  recentSubmissions: SubmissionSummary[];
};

export type SubmissionFilters = {
  formId?: string;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
};

export type SubmissionPage = {
  submissions: SubmissionSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export const MAX_REGISTRATION_FORMS = 5;

/** Slugs that are reserved by the Next.js app and cannot be used for forms. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signin",
  "register",
  "resources",
  "_next",
]);
