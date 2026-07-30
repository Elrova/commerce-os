import { NextResponse } from "next/server";
import {
  IntegrationMutationError,
  type IntegrationErrorCode,
} from "@/lib/supplier-intelligence/integration-mutations";

export function supplierRedirect(
  request: Request,
  pathname: string,
  result: { success?: string; error?: IntegrationErrorCode },
) {
  const url = new URL(pathname, request.url);
  if (result.success) url.searchParams.set("success", result.success);
  if (result.error) url.searchParams.set("error", result.error);
  return NextResponse.redirect(url, 303);
}

export function controlledError(error: unknown, fallback: IntegrationErrorCode) {
  return error instanceof IntegrationMutationError ? error.code : fallback;
}
