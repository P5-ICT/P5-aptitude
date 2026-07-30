export const EXPOSURE_DEPTH_BONUS: Record<string, number> = {
  none: 0,
  basic: 2,
  moderate: 5,
  advanced: 8,
};

export const EXPOSURE_EXPERIENCE_BONUS: Record<string, number> = {
  "0": 0,
  "1-2": 2,
  "3-5": 4,
  "6+": 6,
};

export const INTEREST_BONUS_PER_HIT = 4;

export const SECONDARY_COMPETENCY_WEIGHT = 0.5;

export function getExposureBonus(questionId: string, selected: string[]): number {
  const value = selected[0] ?? "";
  if (questionId === "P003" || questionId === "P005") {
    return EXPOSURE_DEPTH_BONUS[value] ?? 0;
  }
  if (questionId === "P004" || questionId === "P006") {
    return EXPOSURE_EXPERIENCE_BONUS[value] ?? 0;
  }
  return 0;
}

export function getInterestMappings(
  questionId: string,
  selected: string[],
): string[] {
  const roleHits: string[] = [];
  for (const key of selected) {
    const mapping = INTEREST_ROLE_MAP[`${questionId}:${key}`];
    if (mapping) roleHits.push(...mapping);
  }
  return roleHits;
}

const INTEREST_ROLE_MAP: Record<string, string[]> = {
  "I001:A": ["AO", "BD"],
  "I001:B": ["FA", "DA"],
  "I001:C": ["IT", "MC"],
  "I001:D": ["SC", "PC"],
  "I002:A": ["HR", "LS"],
  "I002:B": ["EN", "PT"],
  "I002:C": ["AO", "SC"],
  "I002:D": ["IT", "DA"],
  "I003:A": ["BD", "EN"],
  "I003:B": ["FA", "MC"],
  "I003:C": ["PC", "HR"],
  "I003:D": ["LS", "PT"],
  "I004:A": ["AO", "IT"],
  "I004:B": ["DA", "MC"],
  "I004:C": ["SC", "EN"],
  "I004:D": ["HR", "BD"],
  "I005:A": ["FA", "LS"],
  "I005:B": ["PC", "PT"],
  "I005:C": ["EN", "MC"],
  "I005:D": ["IT", "AO"],
  "I006:A": ["BD", "HR"],
  "I006:B": ["DA", "SC"],
  "I006:C": ["MC", "PT"],
  "I006:D": ["LS", "FA"],
  "I007:A": ["AO", "EN"],
  "I007:B": ["IT", "PC"],
  "I007:C": ["SC", "BD"],
  "I007:D": ["HR", "DA"],
  "I008:A": ["FA", "PT"],
  "I008:B": ["MC", "LS"],
  "I008:C": ["EN", "AO"],
  "I008:D": ["PC", "IT"],
  "I009:A": ["BD", "DA"],
  "I009:B": ["HR", "SC"],
  "I009:C": ["PT", "MC"],
  "I009:D": ["LS", "EN"],
  "I010:A": ["AO", "PC"],
  "I010:B": ["IT", "EN"],
  "I010:C": ["FA", "BD"],
  "I010:D": ["DA", "HR"],
  "I011:A": ["SC", "PT"],
  "I011:B": ["MC", "AO"],
  "I011:C": ["LS", "IT"],
  "I011:D": ["EN", "FA"],
  "I012:A": ["HR", "PT"],
  "I012:B": ["BD", "PC"],
  "I012:C": ["DA", "AO"],
  "I012:D": ["MC", "SC"],
};
