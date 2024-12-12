export const premiumPrices = {
  BASIC: 19.99,
  PREMIUM: 49.99,
};

export const premiumDurations = {
  ONE_MONTH: 1,
  THREE_MONTHS: 3,
  SIX_MONTHS: 6,
  TWELVE_MONTHS: 12,
};

export const gender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
}

// Function to convert number to string
export function numberToString(id: number): string {
  return id.toString();
}

// Function to convert string to number (be cautious of overflow)
export function stringToNumber(id: string): number {
  const numericId = Number(id);

  // Optionally, you can add range checks for safe integer limits here
  if (isNaN(numericId)) {
    throw new Error(`Invalid ID string: ${id}`);
  }

  return numericId;
}

