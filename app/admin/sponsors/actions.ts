"use server";

import { AppwriteException } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { AppwriteConfigError } from "@/lib/appwrite";
import {
  createSponsor,
  deleteSponsor,
  normalizeSponsorWebsite,
} from "@/lib/sponsors";

export type UpdateAdminSponsorsState = {
  status: "idle" | "success" | "error";
  message: string | null;
  toastKey: number;
};

function buildState(
  status: UpdateAdminSponsorsState["status"],
  message: string | null,
): UpdateAdminSponsorsState {
  return {
    status,
    message,
    toastKey: Date.now(),
  };
}

function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function createSponsorAction(
  _previousState: UpdateAdminSponsorsState,
  formData: FormData,
): Promise<UpdateAdminSponsorsState> {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return buildState(
      "error",
      "Your admin session has expired. Sign in again to continue.",
    );
  }

  const titleValue = formData.get("title");
  const websiteValue = formData.get("websiteUrl");
  const imageValue = formData.get("image");
  const sortOrderValue = formData.get("sortOrder");

  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const rawSortOrder =
    typeof sortOrderValue === "string" ? sortOrderValue.trim() : "";

  if (!title) {
    return buildState("error", "Enter a sponsor title to continue.");
  }

  if (!rawSortOrder) {
    return buildState("error", "Enter a sort order to continue.");
  }

  const sortOrder = Number(rawSortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return buildState(
      "error",
      "Sort order must be a whole number greater than or equal to 0.",
    );
  }

  const websiteUrl =
    typeof websiteValue === "string" && websiteValue.trim()
      ? normalizeSponsorWebsite(websiteValue)
      : null;

  if (
    typeof websiteValue === "string" &&
    websiteValue.trim() &&
    !websiteUrl
  ) {
    return buildState(
      "error",
      "Enter a valid sponsor website URL starting with http or https.",
    );
  }

  if (!isImageFile(imageValue) || imageValue.size === 0) {
    return buildState("error", "Upload a sponsor image to continue.");
  }

  if (!imageValue.type.startsWith("image/")) {
    return buildState(
      "error",
      "Upload a valid image file such as PNG, JPG, SVG, or WebP.",
    );
  }

  try {
    await createSponsor({
      title,
      websiteUrl,
      image: imageValue,
      sortOrder,
    });
  } catch (error) {
    if (error instanceof AppwriteException) {
      if (error.code === 404) {
        return buildState(
          "error",
          "Sponsors table or image bucket was not found. Push appwrite.config.json first.",
        );
      }

      if ([401, 403].includes(error.code ?? 0)) {
        return buildState(
          "error",
          "The Appwrite API key needs databases.write and files.write scopes.",
        );
      }

      return buildState(
        "error",
        error.message || "Unable to add the sponsor right now.",
      );
    }

    if (error instanceof AppwriteConfigError) {
      return buildState("error", error.message);
    }

    return buildState("error", "Unable to add the sponsor right now.");
  }

  revalidatePath("/");
  revalidatePath("/admin/sponsors");

  return buildState("success", "Sponsor added successfully.");
}

export async function deleteSponsorAction(
  _previousState: UpdateAdminSponsorsState,
  formData: FormData,
): Promise<UpdateAdminSponsorsState> {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return buildState(
      "error",
      "Your admin session has expired. Sign in again to continue.",
    );
  }

  const sponsorId = formData.get("sponsorId");

  if (typeof sponsorId !== "string" || !sponsorId.trim()) {
    return buildState("error", "Unable to determine which sponsor to remove.");
  }

  try {
    await deleteSponsor(sponsorId.trim());
  } catch (error) {
    if (error instanceof AppwriteException) {
      if (error.code === 404) {
        return buildState("error", "Sponsor was already removed.");
      }

      if ([401, 403].includes(error.code ?? 0)) {
        return buildState(
          "error",
          "The Appwrite API key needs databases.write and files.write scopes.",
        );
      }

      return buildState(
        "error",
        error.message || "Unable to remove the sponsor right now.",
      );
    }

    if (error instanceof AppwriteConfigError) {
      return buildState("error", error.message);
    }

    return buildState("error", "Unable to remove the sponsor right now.");
  }

  revalidatePath("/");
  revalidatePath("/admin/sponsors");

  return buildState("success", "Sponsor removed successfully.");
}
