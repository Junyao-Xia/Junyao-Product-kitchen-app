const COOKWARE_PATTERN =
  /\b(pan|pot|skillet|saucepan|wok|sheet pan|baking sheet|rice cooker|microwave)\b/gi;

const ONE_PAN_PATTERN =
  /\b(one pan|one-pot|one pot|single pan|same pan|one skillet)\b/i;

const SAME_VESSEL_PATTERN =
  /\b(same (skillet|pan|pot)|in the same (skillet|pan|pot))\b/i;

const FEWER_PANS_CLAIM_PATTERN =
  /\b(one pan|one pot|one skillet)\b.*\b(instead of|rather than)\b.*\b(two|2|separate|multiple)\b|\binstead of two pans?\b|\buses one pan instead of two\b|\bfewer pans?\b/i;

export function countCookwareMentions(text: string): number {
  const matches = text.match(COOKWARE_PATTERN);
  if (!matches) {
    return 0;
  }
  const normalized = new Set(matches.map((word) => word.toLowerCase()));
  return normalized.size;
}

export function originalUsesSingleCookingVessel(steps: string[]): boolean {
  if (steps.length === 0) {
    return false;
  }
  const combined = steps.join(" ");
  if (ONE_PAN_PATTERN.test(combined) || SAME_VESSEL_PATTERN.test(combined)) {
    return true;
  }
  const cookwareCount = countCookwareMentions(combined);
  if (cookwareCount === 0) {
    return false;
  }
  if (cookwareCount > 1) {
    return false;
  }
  const separateRiceAndProtein =
    (/\b(cook|simmer|boil)\s+(the\s+)?rice\b/i.test(combined) ||
      /\bcook rice\b/i.test(combined)) &&
    (/\b(cook|pan-fry|fry|sear)\s+(the\s+)?chicken\b/i.test(combined) ||
      /\bcook chicken\b/i.test(combined)) &&
    !SAME_VESSEL_PATTERN.test(combined);
  return !separateRiceAndProtein;
}

export function claimsFewerPansThanBefore(improvement: string): boolean {
  return FEWER_PANS_CLAIM_PATTERN.test(improvement.trim());
}

export function isOneSkilletMeal(steps: string[]): boolean {
  if (!originalUsesSingleCookingVessel(steps)) {
    return false;
  }
  const combined = steps.join(" ");
  return (
    ONE_PAN_PATTERN.test(combined) ||
    SAME_VESSEL_PATTERN.test(combined) ||
    /\b(deep )?skillet\b/i.test(combined)
  );
}

function effectiveCookwareCount(steps: string[]): number {
  if (isOneSkilletMeal(steps)) {
    return 1;
  }
  return countCookwareMentions(steps.join(" "));
}

export function isAlreadySimpleMeal(steps: string[]): boolean {
  if (steps.length === 0) {
    return false;
  }
  const combined = steps.join(" ");
  if (isOneSkilletMeal(steps)) {
    return steps.length <= 4 && countCookwareMentions(combined) <= 2;
  }
  if (!originalUsesSingleCookingVessel(steps)) {
    return steps.length <= 2 && countCookwareMentions(combined) <= 1;
  }
  if (steps.length <= 3 && countCookwareMentions(combined) <= 1) {
    return true;
  }
  return steps.length <= 4 && countCookwareMentions(combined) <= 2;
}

function hasRecognizedCookingShortcut(
  originalSteps: string[],
  simplifiedSteps: string[],
): boolean {
  if (simplifiedSteps.length >= originalSteps.length) {
    return false;
  }
  if (simplifiedSteps.length > originalSteps.length - 2) {
    return false;
  }
  const originalText = originalSteps.join(" ");
  const simplifiedText = simplifiedSteps.join(" ");
  const removedBrowning =
    /\bbrown(ed|ing)?\b/i.test(originalText) &&
    !/\bbrown(ed|ing)?\b/i.test(simplifiedText);
  const removedPushAside =
    /\bpush (it )?to the side\b/i.test(originalText) &&
    !/\bpush (it )?to the side\b/i.test(simplifiedText);
  if (!removedBrowning && !removedPushAside) {
    return false;
  }
  return /\b(skillet|simmer|cover and simmer)\b/i.test(simplifiedText);
}

export function inferDefaultImprovement(
  originalSteps: string[],
  simplifiedSteps: string[],
): string {
  const originalCookware = countCookwareMentions(originalSteps.join(" "));
  const simplifiedCookware = countCookwareMentions(simplifiedSteps.join(" "));
  const originalText = originalSteps.join(" ");
  const simplifiedText = simplifiedSteps.join(" ");

  if (simplifiedCookware < originalCookware) {
    return "Uses fewer pans than the original steps.";
  }

  if (/\bbrown(ed|ing)?\b/i.test(originalText) && !/\bbrown(ed|ing)?\b/i.test(simplifiedText)) {
    return "Skips browning the chicken and simmers everything in one skillet.";
  }
  if (
    /\bpush (it )?to the side\b/i.test(originalText) &&
    !/\bpush (it )?to the side\b/i.test(simplifiedText)
  ) {
    return "Cooks chicken and rice together without pushing the meat aside mid-skillet.";
  }

  if (simplifiedSteps.length < originalSteps.length) {
    return `Combines the recipe into ${simplifiedSteps.length} short steps.`;
  }
  return "Keeps the same ingredients with clearer, shorter steps.";
}

export function alreadySimpleMessage(): string {
  return "This recipe is already simple.";
}

export function improvementClaimSupported(
  improvement: string,
  simplifiedSteps: string[],
  originalSteps: string[] = [],
): boolean {
  const trimmed = improvement.trim();
  if (!trimmed) {
    return false;
  }

  if (
    originalSteps.length > 0 &&
    claimsFewerPansThanBefore(trimmed) &&
    originalUsesSingleCookingVessel(originalSteps)
  ) {
    return false;
  }

  if (
    /\b(fewer|fewer steps|less prep|combines|clearer|shorter|skips|aside)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  const combined = [trimmed, ...simplifiedSteps].join(" ");
  if (ONE_PAN_PATTERN.test(trimmed)) {
    if (
      originalSteps.length > 0 &&
      originalUsesSingleCookingVessel(originalSteps) &&
      claimsFewerPansThanBefore(trimmed)
    ) {
      return false;
    }
    return (
      ONE_PAN_PATTERN.test(combined) ||
      countCookwareMentions(combined) <= 1 ||
      countCookwareMentions(simplifiedSteps.join(" ")) <=
        countCookwareMentions(combined)
    );
  }
  return trimmed.length >= 10;
}

export function effortReducedVersusOriginal(
  originalSteps: string[],
  simplifiedSteps: string[],
): boolean {
  if (simplifiedSteps.length === 0) {
    return false;
  }
  const originalCookware = effectiveCookwareCount(originalSteps);
  const simplifiedCookware = effectiveCookwareCount(simplifiedSteps);
  if (simplifiedCookware > originalCookware) {
    return false;
  }
  if (simplifiedCookware < originalCookware) {
    return true;
  }
  if (isOneSkilletMeal(originalSteps)) {
    if (simplifiedSteps.length >= originalSteps.length - 1) {
      return false;
    }
    return hasRecognizedCookingShortcut(originalSteps, simplifiedSteps);
  }
  if (simplifiedSteps.length < originalSteps.length) {
    return true;
  }
  return originalSteps.length > 4;
}
