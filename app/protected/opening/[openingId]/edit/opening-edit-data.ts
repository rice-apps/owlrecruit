import { headers } from "next/headers";
import type { OpeningInitialData } from "@/components/opening-form/types";

interface OpeningResponse {
  opening?: OpeningInitialData;
  error?: string;
}

function resolveOriginFromHeaders(requestHeaders: Headers): string {
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing host header for edit opening request");
  }

  return `${protocol}://${host}`;
}

export async function getOpeningInitialData(
  orgId: string,
  openingId: string,
): Promise<OpeningInitialData | null> {
  const requestHeaders = await headers();
  const origin = resolveOriginFromHeaders(requestHeaders);
  const cookie = requestHeaders.get("cookie") || "";

  const response = await fetch(
    `${origin}/api/org/${orgId}/openings/${openingId}`,
    {
      method: "GET",
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as OpeningResponse;
    throw new Error(data.error || "Failed to load opening data");
  }

  const data = (await response.json()) as OpeningResponse;

  return data.opening || null;
}
