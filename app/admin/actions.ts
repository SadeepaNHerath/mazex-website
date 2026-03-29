"use server";

import { AppwriteException } from "node-appwrite";
import { redirect } from "next/navigation";
import {
  destroyCurrentAdminSession,
  getCurrentAdminPasswordClient,
} from "@/lib/admin-auth";

export type ChangeAdminPasswordState = {
  error: string | null;
  toastKey: number;
};

export async function logoutAdminAction() {
  await destroyCurrentAdminSession();
  redirect("/login?reason=signed-out");
}

export async function changeAdminPasswordAction(
  _previousState: ChangeAdminPasswordState,
  formData: FormData,
): Promise<ChangeAdminPasswordState> {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return {
      error: "Fill in all password fields to continue.",
      toastKey: Date.now(),
    };
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      error: "Fill in all password fields to continue.",
      toastKey: Date.now(),
    };
  }

  if (newPassword.length < 8) {
    return {
      error: "New password must be at least 8 characters long.",
      toastKey: Date.now(),
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New password and confirmation do not match.",
      toastKey: Date.now(),
    };
  }

  if (currentPassword === newPassword) {
    return {
      error: "Choose a new password that is different from the current one.",
      toastKey: Date.now(),
    };
  }

  try {
    const account = await getCurrentAdminPasswordClient();

    if (!account) {
      return {
        error: "Your admin session has expired. Sign in again to continue.",
        toastKey: Date.now(),
      };
    }

    await account.updatePassword({
      password: newPassword,
      oldPassword: currentPassword,
    });

    await destroyCurrentAdminSession();
  } catch (error) {
    if (error instanceof AppwriteException) {
      if (
        [400, 401, 403].includes(error.code ?? 0) &&
        /password/i.test(error.message)
      ) {
        return {
          error: "Current password is incorrect.",
          toastKey: Date.now(),
        };
      }

      return {
        error: error.message || "Unable to change the password right now.",
        toastKey: Date.now(),
      };
    }

    return {
      error: "Unable to change the password right now.",
      toastKey: Date.now(),
    };
  }

  redirect("/login?reason=password-updated");
}
