const COOKWARE_PATTERN =
  /\b(pan|pot|skillet|saucepan|wok|sheet pan|baking sheet|rice cooker|microwave)\b/gi;

const ONE_PAN_PATTERN =
  /\b(one pan|one-pot|one pot|single pan|same pan|one skillet)\b/i;

export function countCookwareMentions(text: string): number {
  const matches = text.match(COOKWARE_PATTERN);
  if (!matches) {
    return 0;
  }
  const normalized = new Set(matches.map((word) => word.toLowerCase()));
  return normalized.size;
}

export function isAlreadySimpleMeal(steps: string[]): boolean {
  if (steps.length === 0) {
    return false;
  }
  const combined = steps.join(" ");
  return steps.length <= 3 && countCookwareMentions(combined) <= 1;
}

export function improvementClaimSupported(
  improvement: string,
  simplifiedSteps: string[],
): boolean {
  const trimmed = improvement.trim();
  if (!trimmed) {
    return false;
  }
  const combined = [trimmed, ...simplifiedSteps].join(" ");
  if (ONE_PAN_PATTERN.test(trimmed)) {
    return ONE_PAN_PATTERN.test(combined) || countCookwareMentions(combined) <= 1;
  }
  if (/\b(fewer steps|less prep|one pan|one pot|same pan)\b/i.test(trimmed)) {
    return true;
  }
  return trimmed.length >= 12;
}

export function effortReducedVersusOriginal(
  originalSteps: string[],
  simplifiedSteps: string[],
): boolean {
  if (simplifiedSteps.length === 0) {
    return false;
  }
  const originalCookware = countCookwareMentions(originalSteps.join(" "));
  const simplifiedCookware = countCookwareMentions(simplifiedSteps.join(" "));
  if (simplifiedCookware > originalCookware) {
    return false;
  }
  if (simplifiedCookware < originalCookware) {
    return true;
  }
  if (simplifiedSteps.length <= originalSteps.length) {
    return true;
  }
  return originalSteps.length > 4;
}
