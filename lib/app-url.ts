import "server-only";

import type { NextRequest } from "next/server";

const APP_URL_ENV_KEYS = ["NEXT_PUBLIC_APP_URL", "APP_URL"] as const;

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeConfiguredAppUrl(value: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function getForwardedHost(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.split(",")[0]?.trim() ||
    ""
  );
}

function getRequestProtocol(request: NextRequest, host: string) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .replace(/:$/u, "");

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return "http";
  }

  if (forwardedProto) {
    return forwardedProto;
  }

  const requestProtocol = request.nextUrl.protocol.replace(/:$/u, "");
  if (requestProtocol) {
    return requestProtocol;
  }

  return process.env.NODE_ENV === "production" ? "https" : "http";
}

export function getAppBaseUrl(request: NextRequest) {
  for (const envKey of APP_URL_ENV_KEYS) {
    const configuredUrl = normalizeConfiguredAppUrl(trim(process.env[envKey]));
    if (configuredUrl) {
      return configuredUrl;
    }
  }

  const host = getForwardedHost(request);
  if (host) {
    return new URL(`${getRequestProtocol(request, host)}://${host}`);
  }

  return new URL(request.nextUrl.origin);
}

export function buildAppUrl(request: NextRequest, path: string) {
  return new URL(path, getAppBaseUrl(request));
}
