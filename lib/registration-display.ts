import type { FieldOption, FormAvailability, FormDefinition } from "@/lib/registration-types";

const DISPLAY_TIME_ZONE = "Asia/Colombo";

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

export function formatOptionsForTextarea(options: FieldOption[]) {
  return options.map((option) => `${option.label}|${option.value}`).join("\n");
}
