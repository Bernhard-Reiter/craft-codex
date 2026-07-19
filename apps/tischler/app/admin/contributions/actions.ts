"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  approveAsMeister,
  reviewConfigFromEnv,
  transitionContribution,
} from "../../../lib/admin/review";

/**
 * Server-Actions fuers Meister-Review — laufen NUR hinter der Basic-Auth-
 * Middleware (/admin/*; auch die Action-POSTs gehen an diese Pfade).
 * Statuswechsel ausschliesslich via craft_transition (Service-Role).
 * KEIN Publish hier — Publish kommt via Export-Script (PR C).
 */

const ACTOR = "meister";

function backToDetail(id: string, error?: string): never {
  const suffix = error ? `?error=${encodeURIComponent(error)}` : "";
  revalidatePath("/admin/contributions");
  revalidatePath(`/admin/contributions/${id}`);
  redirect(`/admin/contributions/${id}${suffix}`);
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** submitted -> in_review */
export async function takeInReviewAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  let error: string | undefined;
  try {
    await transitionContribution(
      reviewConfigFromEnv(), id, "submitted", "in_review", ACTOR, "taken into review",
    );
  } catch (err) {
    error = message(err);
  }
  backToDetail(id, error);
}

/** changes_requested -> in_review (erlaubte Rueck-Kante der Statusmaschine) */
export async function reopenReviewAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  let error: string | undefined;
  try {
    await transitionContribution(
      reviewConfigFromEnv(), id, "changes_requested", "in_review", ACTOR, "back into review",
    );
  } catch (err) {
    error = message(err);
  }
  backToDetail(id, error);
}

/** in_review -> approved (setzt vorher approved_revision auf die aktuelle Revision) */
export async function approveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  let error: string | undefined;
  try {
    await approveAsMeister(reviewConfigFromEnv(), id, ACTOR);
  } catch (err) {
    error = message(err);
  }
  backToDetail(id, error);
}

/** in_review -> changes_requested, mit Begruendung */
export async function requestChangesAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  let error: string | undefined;
  if (!reason) {
    error = "Begründung fehlt";
  } else {
    try {
      await transitionContribution(
        reviewConfigFromEnv(), id, "in_review", "changes_requested", ACTOR, reason,
      );
    } catch (err) {
      error = message(err);
    }
  }
  backToDetail(id, error);
}

/** submitted|in_review -> rejected, mit Begruendung */
export async function rejectAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  let error: string | undefined;
  if (!reason) {
    error = "Begründung fehlt";
  } else if (from !== "submitted" && from !== "in_review") {
    error = `Ablehnen aus Status "${from}" nicht möglich`;
  } else {
    try {
      await transitionContribution(reviewConfigFromEnv(), id, from, "rejected", ACTOR, reason);
    } catch (err) {
      error = message(err);
    }
  }
  backToDetail(id, error);
}
