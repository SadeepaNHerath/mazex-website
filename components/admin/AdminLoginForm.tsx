"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  loginAdminAction,
  type AdminLoginState,
} from "@/app/login/actions";

const initialState: AdminLoginState = {
  error: null,
  toastKey: 0,
};

const noticeCopy: Record<
  string,
  {
    icon: typeof ShieldAlert;
    message: string;
    className: string;
  }
> = {
  misconfigured: {
    icon: ShieldAlert,
    message:
      "Admin auth is not configured yet. Add the required environment variables before using this login.",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-100",
  },
  unauthorized: {
    icon: ShieldAlert,
    message:
      "Your session is missing the required admin access. Sign in again with a verified admin account.",
    className:
      "border-rose-500/25 bg-rose-500/10 text-rose-100",
  },
  "signed-out": {
    icon: ShieldCheck,
    message: "The admin session has been signed out.",
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  },
  "password-updated": {
    icon: ShieldCheck,
    message: "Password changed successfully. Sign in with your new password.",
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  },
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="theme-button theme-button-register w-full cursor-pointer rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {pending ? "Signing In..." : disabled ? "Configure Admin Auth First" : "Sign In"}
    </button>
  );
}

type LoginToast = {
  id: string;
  icon: typeof ShieldAlert;
  message: string;
  className: string;
};

function LoginToastMessage({
  toast,
  onClose,
}: {
  toast: LoginToast;
  onClose: () => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [onClose, toast.id]);

  return (
    <div
      className={`fixed top-24 right-4 left-4 z-50 mx-auto flex w-auto max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_1.25rem_3.125rem_rgba(0,0,0,0.45)] backdrop-blur-xl sm:right-6 sm:left-auto ${toast.className}`}
      role="status"
      aria-live="polite"
    >
      <toast.icon className="h-4.5 w-4.5 shrink-0" />
      <p className="flex-1 pr-2 leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-current/80 transition hover:bg-white/10 hover:text-current"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AdminLoginForm({
  authConfigured,
}: {
  authConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const [state, formAction] = useActionState(loginAdminAction, initialState);
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "";
  const notice = noticeCopy[reason];
  const activeToast = state.error
    ? {
        id: `error:${state.toastKey}`,
        icon: ShieldAlert,
        message: state.error,
        className: "border-rose-500/25 bg-rose-500/10 text-rose-100",
      }
    : notice
      ? {
          id: `notice:${reason}`,
          icon: notice.icon,
          message: notice.message,
          className: notice.className,
        }
      : null;
  const visibleToast =
    activeToast && activeToast.id !== dismissedToastId ? activeToast : null;

  return (
    <>
      {visibleToast ? (
        <LoginToastMessage
          toast={visibleToast}
          onClose={() => setDismissedToastId(visibleToast.id)}
        />
      ) : null}

      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-3">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#E2E8F0]"
          >
            Email address
          </label>
          <div className="flex h-[3.25rem] items-center gap-3 rounded-xl border border-[#2a223a] bg-[#060813] px-4 shadow-[inset_0_0.0625rem_0_rgba(248,250,252,0.02)] transition focus-within:border-[#8a73a6] focus-within:shadow-[0_0_0_0.1875rem_rgba(107,82,143,0.18)]">
            <Mail className="h-5 w-5 shrink-0 text-[#8a73a6]" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="user@knurdz.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="admin-auth-input h-full w-full border-0 bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#64748B]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#E2E8F0]"
          >
            Password
          </label>
          <div className="flex h-[3.25rem] items-center gap-3 rounded-xl border border-[#2a223a] bg-[#060813] px-4 shadow-[inset_0_0.0625rem_0_rgba(248,250,252,0.02)] transition focus-within:border-[#8a73a6] focus-within:shadow-[0_0_0_0.1875rem_rgba(107,82,143,0.18)]">
            <LockKeyhole className="h-5 w-5 shrink-0 text-[#8a73a6]" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-auth-input h-full w-full border-0 bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#64748B]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#8a73a6] transition hover:bg-white/5 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        <SubmitButton disabled={!authConfigured} />
      </form>
    </>
  );
}
