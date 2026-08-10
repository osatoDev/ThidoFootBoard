export const featureSuggestionCategories = [
  "lineup-building",
  "imports",
  "design-export",
  "saving-sharing",
  "other",
] as const;

export type FeatureSuggestionCategory = (typeof featureSuggestionCategories)[number];

export class FeatureSuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureSuggestionError";
  }
}

export function parseFeatureSuggestion(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new FeatureSuggestionError("Add a feature suggestion.");
  }

  const record = body as Record<string, unknown>;
  const suggestion =
    typeof record.suggestion === "string"
      ? record.suggestion.trim().replace(/\s+/g, " ")
      : "";
  const category =
    typeof record.category === "string" &&
    featureSuggestionCategories.includes(
      record.category as FeatureSuggestionCategory,
    )
      ? (record.category as FeatureSuggestionCategory)
      : "other";

  if (suggestion.length < 10) {
    throw new FeatureSuggestionError(
      "Tell us a little more about the feature you would like.",
    );
  }
  if (suggestion.length > 1200) {
    throw new FeatureSuggestionError(
      "Keep your suggestion under 1,200 characters.",
    );
  }

  return { category, suggestion };
}
