import type { FeatureSuggestionCategory } from "../api/_featureSuggestion";

type FeatureSuggestionResponse = {
  error?: string;
  ok?: boolean;
};

export async function submitFeatureSuggestion(
  category: FeatureSuggestionCategory,
  suggestion: string,
) {
  const response = await fetch("/api/feature-suggestions", {
    body: JSON.stringify({ category, suggestion }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => ({}))) as FeatureSuggestionResponse;

  if (!response.ok) {
    throw new Error(result.error || "Could not send your suggestion.");
  }
}
